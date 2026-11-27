import { connectToDatabase } from "@/lib/mongodb/connection";
import { hashPassword } from "@/lib/auth/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { handleRouteError, jsonCreated } from "@/lib/api";
import { registerSchema } from "@/lib/validation/auth";
import { Customer, User } from "@/models";
import { checkRateLimit, clientIp, tooManyRequests } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  try {
    const limit = checkRateLimit({
      key: `auth:register:${clientIp(request)}`,
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });
    if (!limit.ok) return tooManyRequests(limit.retryAfterSec);

    const body = registerSchema.parse(await request.json());
    await connectToDatabase();

    const existing = await User.findOne({ email: body.email.toLowerCase(), deletedAt: null });
    if (existing) {
      throw new Error("An account with this email already exists");
    }

    const customer = await Customer.create({
      name: body.name,
      email: body.email.toLowerCase(),
      phone: body.phone,
    });

    const user = await User.create({
      name: body.name,
      email: body.email.toLowerCase(),
      passwordHash: await hashPassword(body.password),
      role: "customer",
      phone: body.phone,
      customerId: customer._id,
      permissions: [],
    });

    customer.userId = user._id;
    await customer.save();

    const token = await createSessionToken({
      sub: String(user._id),
      email: user.email,
      name: user.name,
      role: "customer",
      permissions: [],
      customerId: String(customer._id),
    });

    await setSessionCookie(token);

    return jsonCreated({
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
