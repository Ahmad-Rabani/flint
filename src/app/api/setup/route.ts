import { connectToDatabase } from "@/lib/mongodb/connection";
import { hashPassword } from "@/lib/auth/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { permissionsForRole } from "@/lib/permissions";
import { handleRouteError, jsonCreated, jsonOk } from "@/lib/api";
import { setupAdminSchema } from "@/lib/validation/auth";
import { BusinessSettings, Role, User } from "@/models";
import { ROLE_PERMISSIONS, USER_ROLES, DEFAULT_PAYMENT_METHODS } from "@/constants";

export async function GET() {
  try {
    await connectToDatabase();
    const settings = await BusinessSettings.findOne({ key: "default" });
    const adminCount = await User.countDocuments({
      role: { $in: ["super_admin", "admin"] },
      deletedAt: null,
    });
    return jsonOk({
      setupRequired: !settings?.setupCompleted && adminCount === 0,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = setupAdminSchema.parse(await request.json());
    await connectToDatabase();

    const adminCount = await User.countDocuments({
      role: { $in: ["super_admin", "admin"] },
      deletedAt: null,
    });

    if (adminCount > 0) {
      throw new Error("Initial setup has already been completed");
    }

    for (const role of USER_ROLES.filter((r) => r !== "customer")) {
      await Role.findOneAndUpdate(
        { key: role },
        {
          key: role,
          name: role
            .split("_")
            .map((part) => part[0].toUpperCase() + part.slice(1))
            .join(" "),
          permissions: ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS],
          isSystem: true,
        },
        { upsert: true, new: true },
      );
    }

    const permissions = permissionsForRole("super_admin");
    const user = await User.create({
      name: body.name,
      email: body.email.toLowerCase(),
      passwordHash: await hashPassword(body.password),
      role: "super_admin",
      permissions,
    });

    await BusinessSettings.findOneAndUpdate(
      { key: "default" },
      {
        key: "default",
        businessName: body.businessName || "FLINT",
        email: body.email.toLowerCase(),
        currency: "USD",
        taxRate: 0.08,
        paymentMethods: DEFAULT_PAYMENT_METHODS,
        setupCompleted: true,
        seo: {
          defaultTitle: "FLINT — Hand-forged knives & axes",
          defaultDescription:
            "Premium handmade knives, axes, and custom blades forged for collectors and craftspeople.",
        },
      },
      { upsert: true, new: true },
    );

    const token = await createSessionToken({
      sub: String(user._id),
      email: user.email,
      name: user.name,
      role: "super_admin",
      permissions,
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
