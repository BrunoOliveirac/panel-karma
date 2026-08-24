"use client";

import { useEffect, useState } from "react";
import { LatestNotificationsResponse } from "../models/notification";
import { NotificationService } from "../services/notification.service";
import { useLoggedUserStore } from "../store/use-logged-user-store";

const notificationService = new NotificationService();
const listeners = new Set<() => void>();

let eventSource: EventSource | null = null;
let latestPromise: Promise<LatestNotificationsResponse> | null = null;
let readAllLocally = false;
const readIdsLocally = new Set<string>();

function notify() {
  listeners.forEach((listener) => listener());
}

function fetchLatestNotifications() {
  const request = notificationService.getLatestNotifications().then((data) => {
    if (latestPromise !== request) return data;

    readAllLocally = false;
    readIdsLocally.clear();
    return data;
  });

  latestPromise = request;
  notify();
  return request;
}

function ensureLatestPromise() {
  return latestPromise ?? fetchLatestNotifications();
}

function markNotificationReadLocally(notificationId: string) {
  readIdsLocally.add(notificationId);
  notify();
}

function markAllNotificationsReadLocally() {
  readAllLocally = true;
  notify();
}

function startNotificationStream() {
  if (eventSource) return;

  eventSource = new EventSource("/api/notifications/stream");
  eventSource.onmessage = () => fetchLatestNotifications();
}

function stopNotificationSession() {
  eventSource?.close();
  eventSource = null;
  latestPromise = null;
  readAllLocally = false;
  readIdsLocally.clear();
}

/**
 * Apply local read marks on top of the last fetched list, without replacing
 * the promise (which would remount the list through Suspense).
 */
export function withLocalReadState(
  data: LatestNotificationsResponse,
): LatestNotificationsResponse {
  if (!readAllLocally && readIdsLocally.size === 0) return data;

  const notifications = data.notifications.map((notification) =>
    notification.read ||
    readAllLocally ||
    readIdsLocally.has(notification.id)
      ? { ...notification, read: true }
      : notification,
  );

  return {
    notifications,
    hasUnreadNotifications: notifications.some(
      (notification) => !notification.read,
    ),
  };
}

useLoggedUserStore.subscribe((state) => {
  if (!state.user) stopNotificationSession();
});

/**
 * Keep a single notifications request and SSE connection for the session.
 */
export function useNotificationStream() {
  const user = useLoggedUserStore((state) => state.user);
  const [, setRevision] = useState(0);

  useEffect(() => {
    if (!user) return;

    startNotificationStream();

    const listener = () => setRevision((revision) => revision + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, [user]);

  return {
    notificationsPromise: user ? ensureLatestPromise() : null,
    refreshNotifications: fetchLatestNotifications,
    markNotificationReadLocally,
    markAllNotificationsReadLocally,
  };
}
