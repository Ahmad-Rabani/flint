import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { Customer } from "@/models/Customer";

const schema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid email" },
        { status: 400 },
      );
    }

    const { email } = parsed.data;

    // Upsert customer with marketingOptIn
    await connectToDatabase();
    const existing = await Customer.findOne({ email, deletedAt: null });

    if (existing) {
      if (!existing.marketingOptIn) {
        await Customer.updateOne({ _id: existing._id }, { $set: { marketingOptIn: true } });
      }
    } else {
      await Customer.create({
        name: email.split("@")[0] ?? "Subscriber",
        email,
        marketingOptIn: true,
      });
    }

    return NextResponse.json({ success: true, message: "Subscribed successfully." });
  } catch (err) {
    console.error("[newsletter]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
