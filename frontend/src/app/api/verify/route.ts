import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
        const backendRes = await fetch(`${backendUrl}/api/v1/auth/verify`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            credentials: "include",
        });
        const data = await backendRes.json();
        return NextResponse.json(data, { status: backendRes.status });
    } catch (error) {
        return NextResponse.json({ success: false, message: "Proxy error", error: (error as Error).message }, { status: 500 });
    }
}
