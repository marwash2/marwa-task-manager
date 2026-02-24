"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

interface Task {
  _id?: string;
  title: string;
  completed: boolean;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState("");
  const { data: session } = useSession();
  // Fetch tasks from database
  const deleteTask = async (id: string) => {
    await fetch("/api/tasks", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    fetchTasks();
  };
  const toggleTask = async (id: string, completed: boolean) => {
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, completed }),
    });

    fetchTasks();
  };

  const fetchTasks = async () => {
    const res = await fetch("/api/tasks");
    const data = await res.json();
    setTasks(data);
  };

  useEffect(() => {
    const loadTasks = async () => {
      await fetchTasks();
    };
    loadTasks();
  }, []);

  const addTask = async () => {
    if (!input.trim()) return;

    await fetch("/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: input }),
    });

    setInput("");
    fetchTasks();
  };
  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <button
          onClick={() => signIn("github")}
          className="bg-black text-white px-6 py-3 rounded-md"
        >
          Sign in with GitHub
        </button>
      </main>
    );
  }
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center px-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Task Manager</h1>
            <p className="text-sm text-gray-500">
              Welcome, {session.user?.name}
            </p>
          </div>

          <button
            onClick={() => signOut()}
            className="text-sm text-red-500 hover:underline"
          >
            Sign Out
          </button>
        </div>

        {/* Add Task */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter a task..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
          <button
            onClick={addTask}
            className="bg-black text-white px-4 py-2 rounded-lg hover:opacity-80 transition"
          >
            Add
          </button>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task._id}
              className="flex justify-between items-center bg-gray-50 p-3 rounded-lg shadow-sm hover:shadow-md transition"
            >
              <span
                onClick={() => toggleTask(task._id!, task.completed)}
                className={`cursor-pointer ${
                  task.completed ? "line-through text-gray-400" : ""
                }`}
              >
                {task.title}
              </span>

              <button
                onClick={() => deleteTask(task._id!)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
