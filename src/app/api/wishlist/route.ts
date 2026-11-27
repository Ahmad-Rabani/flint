import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { getSession } from "@/lib/auth/session";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { Product, Wishlist } from "@/models";
import { z } from "zod";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return jsonError("Unauthorized", 401);
    await connectToDatabase();

    const wishlist = await Wishlist.findOne({ userId: session.id }).lean();
    if (!wishlist?.productIds?.length) return jsonOk({ items: [] });

    const productIds = wishlist.productIds.map((id) => new Types.ObjectId(String(id)));
    const products = await Product.find({
      _id: { $in: productIds },
      deletedAt: null,
      status: "active",
    })
      .select("name slug price compareAtPrice images stock")
      .lean();

    return jsonOk({
      items: products.map((p) => ({
        id: String(p._id),
        name: p.name,
        slug: p.slug,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        image: p.images?.[0]?.url,
        stock: p.stock,
      })),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

const mutateSchema = z.object({
  productId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Unauthorized", 401);
    const body = mutateSchema.parse(await request.json());
    await connectToDatabase();

    const wishlist = await Wishlist.findOneAndUpdate(
      { userId: session.id },
      { $addToSet: { productIds: body.productId } },
      { upsert: true, new: true },
    );

    return jsonOk({
      productIds: wishlist.productIds.map((id) => String(id)),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Unauthorized", 401);
    const body = mutateSchema.parse(await request.json());
    await connectToDatabase();

    const wishlist = await Wishlist.findOneAndUpdate(
      { userId: session.id },
      { $pull: { productIds: body.productId } },
      { new: true },
    );

    return jsonOk({
      productIds: (wishlist?.productIds ?? []).map((id) => String(id)),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
