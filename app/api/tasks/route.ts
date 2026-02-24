import { getServerSession } from "next-auth";
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

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("taskManager");

    const body = await request.json();

    const newTask = {
      title: body.title,
      completed: false,
      userEmail: session.user?.email,
      createdAt: new Date(),
    };

    await db.collection("tasks").insertOne(newTask);

    return NextResponse.json({ message: "Task added" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to add task" }, { status: 500 });
  }
}
export async function DELETE(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("taskManager");

    const { id } = await request.json();

    await db.collection("tasks").deleteOne({
      _id: new ObjectId(id),
    });

    return NextResponse.json({ message: "Task deleted" });
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
    const client = await clientPromise;
    const db = client.db("taskManager");

    const { id, completed } = await request.json();

    await db
      .collection("tasks")
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { completed: !completed } },
      );

    return NextResponse.json({ message: "Task updated" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 },
    );
  }
}
