import { connectToDatabase } from "@/lib/mongodb/connection";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { resolvePermissionsForUser } from "@/lib/permissions";
import { handleRouteError, jsonOk } from "@/lib/api";
import { loginSchema } from "@/lib/validation/auth";
import { User } from "@/models";
import { writeAuditLog } from "@/lib/auth/audit";
import { checkRateLimit, clientIp, tooManyRequests } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  try {
    const limit = checkRateLimit({
      key: `auth:login:${clientIp(request)}`,
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    if (!limit.ok) return tooManyRequests(limit.retryAfterSec);

    const body = loginSchema.parse(await request.json());
    await connectToDatabase();

    const user = await User.findOne({
      email: body.email.toLowerCase(),
      deletedAt: null,
      isActive: true,
    }).lean();

    if (!user) {
      return handleRouteError(new Error("Invalid email or password"));
    }

    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) {
      return handleRouteError(new Error("Invalid email or password"));
    }

    const permissions = await resolvePermissionsForUser({
      role: user.role,
      permissions: user.permissions,
    });

    const token = await createSessionToken({
      sub: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
      permissions,
      customerId: user.customerId ? String(user.customerId) : undefined,
    });

    await setSessionCookie(token);

    await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });

    try {
      await writeAuditLog({
        actor: {
          id: String(user._id),
          email: user.email,
          name: user.name,
          role: user.role,
          permissions,
        },
        action: "auth.login",
        entityType: "User",
        entityId: String(user._id),
        summary: "User signed in",
      });
    } catch {
      // Never block login on audit failure
    }

    return jsonOk({
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: [...permissions],
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
