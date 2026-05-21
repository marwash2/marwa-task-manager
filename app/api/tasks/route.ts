import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("taskManager");

    const tasks = await db
      .collection("tasks")
      .find({ userEmail: session.user?.email })
      .toArray();

    return NextResponse.json(tasks);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // 1️⃣ Ensure user is authenticated
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2️⃣ Ensure user email exists (required for DB schema)
    if (!session.user?.email) {
      return NextResponse.json(
        { error: "User email missing from session" },
        { status: 400 },
      );
    }

    const body = await request.json();

    // 3️⃣ Validate input
    if (!body.title || typeof body.title !== "string") {
      return NextResponse.json(
        { error: "Invalid task title" },
        { status: 400 },
      );
    }
    if (!body.priority || !body.dueDate) {
      return NextResponse.json(
        { error: "Priority and due date are required" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("taskManager");

    const newTask = {
      title: body.title.trim(),
      completed: false,
      priority: body.priority,
      dueDate: new Date(body.dueDate),
      userEmail: session.user.email,
      createdAt: new Date(),
    };

    const result = await db.collection("tasks").insertOne(newTask);

    // 4️⃣ Return clean response
    return NextResponse.json({
      _id: result.insertedId.toString(),
      title: newTask.title,
      completed: newTask.completed,
      userEmail: newTask.userEmail,
      createdAt: newTask.createdAt,
    });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json({ error: "Failed to add task" }, { status: 500 });
  }
}
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("taskManager");

    await db.collection("tasks").deleteOne({
      _id: new ObjectId(id),
      userEmail: session.user.email,
    });

    return NextResponse.json({
      message: "Task deleted",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 },
    );
  }
}
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, completed } = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("taskManager");

    await db.collection("tasks").updateOne(
      {
        _id: new ObjectId(id),
        userEmail: session.user.email,
      },
      {
        $set: {
          completed: !completed,
        },
      },
    );

    return NextResponse.json({
      message: "Task updated",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 },
    );
  }
}
