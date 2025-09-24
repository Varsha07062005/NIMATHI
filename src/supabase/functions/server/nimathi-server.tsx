import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Health check endpoint
app.get("/make-server-2843aea9/health", (c) => {
  return c.json({ status: "ok", service: "nimathi-backend" });
});

// User Registration
app.post("/make-server-2843aea9/auth/signup", async (c) => {
  try {
    const { petName, email, password } = await c.req.json();

    if (!petName || !email || !password) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { pet_name: petName },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (authError) {
      console.log(`Signup error for ${email}: ${authError.message}`);
      return c.json({ error: authError.message }, 400);
    }

    // Store additional user data in KV store
    const userId = authData.user.id;
    const userData = {
      id: userId,
      petName,
      email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${petName}`,
      rewardPoints: 0,
      stressLevels: [],
      createdAt: new Date().toISOString()
    };

    await kv.set(`user:${userId}`, userData);

    return c.json({ 
      message: "User created successfully",
      user: userData
    });

  } catch (error) {
    console.log(`Signup error: ${error}`);
    return c.json({ error: "Internal server error during signup" }, 500);
  }
});

// User Profile Management
app.get("/make-server-2843aea9/user/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const accessToken = c.req.header('Authorization')?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: "Authorization token required" }, 401);
    }

    // Verify user is authenticated
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (!user || user.id !== userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userData = await kv.get(`user:${userId}`);
    
    if (!userData) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({ user: userData });

  } catch (error) {
    console.log(`Get user error: ${error}`);
    return c.json({ error: "Internal server error while fetching user" }, 500);
  }
});

app.put("/make-server-2843aea9/user/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const updates = await c.req.json();

    if (!accessToken) {
      return c.json({ error: "Authorization token required" }, 401);
    }

    // Verify user is authenticated
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (!user || user.id !== userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const existingData = await kv.get(`user:${userId}`);
    if (!existingData) {
      return c.json({ error: "User not found" }, 404);
    }

    const updatedData = {
      ...existingData,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await kv.set(`user:${userId}`, updatedData);

    return c.json({ user: updatedData });

  } catch (error) {
    console.log(`Update user error: ${error}`);
    return c.json({ error: "Internal server error while updating user" }, 500);
  }
});

// Task Management
app.get("/make-server-2843aea9/tasks/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const accessToken = c.req.header('Authorization')?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: "Authorization token required" }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (!user || user.id !== userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const tasks = await kv.getByPrefix(`task:${userId}:`);
    
    return c.json({ tasks: tasks || [] });

  } catch (error) {
    console.log(`Get tasks error: ${error}`);
    return c.json({ error: "Internal server error while fetching tasks" }, 500);
  }
});

app.post("/make-server-2843aea9/tasks/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const taskData = await c.req.json();

    if (!accessToken) {
      return c.json({ error: "Authorization token required" }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (!user || user.id !== userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const taskId = `${userId}_${Date.now()}`;
    const task = {
      id: taskId,
      userId,
      ...taskData,
      createdAt: new Date().toISOString()
    };

    await kv.set(`task:${userId}:${taskId}`, task);

    return c.json({ task });

  } catch (error) {
    console.log(`Create task error: ${error}`);
    return c.json({ error: "Internal server error while creating task" }, 500);
  }
});

// Journal Entries
app.get("/make-server-2843aea9/journal/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const accessToken = c.req.header('Authorization')?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: "Authorization token required" }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (!user || user.id !== userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const entries = await kv.getByPrefix(`journal:${userId}:`);
    
    return c.json({ entries: entries || [] });

  } catch (error) {
    console.log(`Get journal entries error: ${error}`);
    return c.json({ error: "Internal server error while fetching journal entries" }, 500);
  }
});

app.post("/make-server-2843aea9/journal/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const entryData = await c.req.json();

    if (!accessToken) {
      return c.json({ error: "Authorization token required" }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (!user || user.id !== userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const entryId = `${userId}_${Date.now()}`;
    const entry = {
      id: entryId,
      userId,
      ...entryData,
      createdAt: new Date().toISOString()
    };

    await kv.set(`journal:${userId}:${entryId}`, entry);

    return c.json({ entry });

  } catch (error) {
    console.log(`Create journal entry error: ${error}`);
    return c.json({ error: "Internal server error while creating journal entry" }, 500);
  }
});

// Activity Sessions (Meditation, Drawing)
app.post("/make-server-2843aea9/activity/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const activityData = await c.req.json();

    if (!accessToken) {
      return c.json({ error: "Authorization token required" }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (!user || user.id !== userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const activityId = `${userId}_${Date.now()}`;
    const activity = {
      id: activityId,
      userId,
      ...activityData,
      createdAt: new Date().toISOString()
    };

    await kv.set(`activity:${userId}:${activityId}`, activity);

    // Update user reward points
    const userData = await kv.get(`user:${userId}`);
    if (userData) {
      const pointsEarned = activityData.type === 'meditation' ? 10 : 
                          activityData.type === 'drawing' ? 15 : 
                          activityData.type === 'journaling' ? 20 : 5;
      
      userData.rewardPoints = (userData.rewardPoints || 0) + pointsEarned;
      await kv.set(`user:${userId}`, userData);
    }

    return c.json({ activity, pointsEarned: pointsEarned || 5 });

  } catch (error) {
    console.log(`Create activity error: ${error}`);
    return c.json({ error: "Internal server error while creating activity" }, 500);
  }
});

// Stress Level Tracking
app.post("/make-server-2843aea9/stress-level/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { level, date } = await c.req.json();

    if (!accessToken) {
      return c.json({ error: "Authorization token required" }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (!user || user.id !== userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userData = await kv.get(`user:${userId}`);
    if (!userData) {
      return c.json({ error: "User not found" }, 404);
    }

    // Add stress level to user data
    const stressEntry = {
      level,
      date: date || new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString()
    };

    userData.stressLevels = userData.stressLevels || [];
    userData.stressLevels.push(stressEntry);

    // Keep only last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    userData.stressLevels = userData.stressLevels.filter(entry => 
      new Date(entry.timestamp) > thirtyDaysAgo
    );

    await kv.set(`user:${userId}`, userData);

    return c.json({ message: "Stress level recorded", stressLevels: userData.stressLevels });

  } catch (error) {
    console.log(`Record stress level error: ${error}`);
    return c.json({ error: "Internal server error while recording stress level" }, 500);
  }
});

// Feedback Form
app.post("/make-server-2843aea9/feedback", async (c) => {
  try {
    const feedbackData = await c.req.json();
    const accessToken = c.req.header('Authorization')?.split(' ')[1];

    let userId = 'anonymous';
    if (accessToken) {
      const { data: { user }, error } = await supabase.auth.getUser(accessToken);
      if (user) {
        userId = user.id;
      }
    }

    const feedbackId = `${userId}_${Date.now()}`;
    const feedback = {
      id: feedbackId,
      userId,
      ...feedbackData,
      createdAt: new Date().toISOString()
    };

    await kv.set(`feedback:${feedbackId}`, feedback);

    return c.json({ message: "Feedback submitted successfully" });

  } catch (error) {
    console.log(`Submit feedback error: ${error}`);
    return c.json({ error: "Internal server error while submitting feedback" }, 500);
  }
});

Deno.serve(app.fetch);