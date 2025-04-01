import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";

// In-memory store (replace with database)
const users: any[] = [];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  try {
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.REDIRECT_URI,
        grant_type: "authorization_code",
      }
    );

    const { access_token } = tokenResponse.data;
    const userInfo = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    const { email } = userInfo.data;
    let user = users.find((u) => u.email === email);

    if (!user) {
      const randomStr = Math.random().toString(36).substring(2, 10);
      const username = `user_${randomStr}`;
      const password = Math.random().toString(36).slice(-15);
      const hashedPassword = await bcrypt.hash(password, 10);

      user = { email, username, password: hashedPassword };
      users.push(user);
    }

    // Set cookie for session
    cookies().set("session", JSON.stringify({ email: user.email, username: user.username }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
    });

    return NextResponse.redirect(new URL("/", req.url));
  } catch (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}