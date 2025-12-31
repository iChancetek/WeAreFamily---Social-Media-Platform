import { pgTable, text, timestamp, jsonb, serial, pgEnum, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["admin", "member", "pending"]);

export const users = pgTable("users", {
    id: text("id").primaryKey(), // Clerk ID
    email: text("email").notNull().unique(),
    role: roleEnum("role").default("pending").notNull(),
    profileData: jsonb("profile_data"), // Bio, avatar url, etc.
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const posts = pgTable("posts", {
    id: serial("id").primaryKey(),
    authorId: text("author_id").references(() => users.id).notNull(),
    content: text("content").notNull(),
    mediaUrls: jsonb("media_urls").$type<string[]>(), // Array of image/video URLs
    likes: jsonb("likes").default([]).$type<string[]>(), // Array of User IDs
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const postsRelations = relations(posts, ({ one, many }) => ({
    author: one(users, {
        fields: [posts.authorId],
        references: [users.id],
    }),
}));

export const events = pgTable("events", {
    id: serial("id").primaryKey(),
    creatorId: text("creator_id").references(() => users.id).notNull(),
    title: text("title").notNull(),
    description: text("description"),
    date: timestamp("date").notNull(),
    location: text("location"),
    attendees: jsonb("attendees").default([]).$type<string[]>(), // Array of User IDs
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chats = pgTable("chats", {
    id: serial("id").primaryKey(),
    name: text("name"), // For group chats or just ease
    isGroup: jsonb("is_group").default(false),
    participants: jsonb("participants").$type<string[]>(), // Array of User IDs
    lastMessageAt: timestamp("last_message_at").defaultNow(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
    id: serial("id").primaryKey(),
    chatId: serial("chat_id").references(() => chats.id).notNull(),
    senderId: text("sender_id").references(() => users.id).notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatsRelations = relations(chats, ({ many }) => ({
    messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
    chat: one(chats, {
        fields: [messages.chatId],
        references: [chats.id],
    }),
    sender: one(users, {
        fields: [messages.senderId],
        references: [users.id],
    }),
}));
