import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { getSession } from "@/lib/auth/session";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { addressSchema } from "@/lib/validation/checkout";
import { Customer, User } from "@/models";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  address: addressSchema,
});

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Unauthorized", 401);

    const body = schema.parse(await request.json());
    await connectToDatabase();

    const email = body.email.toLowerCase();
    const userId = new Types.ObjectId(session.id);
    const existingEmail = await User.findOne({
      email,
      _id: { $ne: userId },
      deletedAt: null,
    });
    if (existingEmail) throw new Error("Email is already in use");

    await User.findByIdAndUpdate(userId, {
      name: body.name,
      email,
      phone: body.phone,
    });

    const address = { ...body.address, label: "Default", isDefault: true };

    if (session.customerId) {
      await Customer.findByIdAndUpdate(session.customerId, {
        name: body.name,
        email,
        phone: body.phone,
        addresses: [address],
      });
    } else {
      const customer = await Customer.findOneAndUpdate(
        { email: session.email.toLowerCase(), deletedAt: null },
        {
          name: body.name,
          email,
          phone: body.phone,
          userId,
          addresses: [address],
        },
        { upsert: true, new: true },
      );
      await User.findByIdAndUpdate(userId, { customerId: customer._id });
    }

    return jsonOk({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
