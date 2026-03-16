"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Client component that automatically refreshes the page when the artist
 * status is "pending_review".
 *
 * This ensures the artist dashboard updates within seconds when a manager
 * approves their profile, without requiring manual refresh.
 *
 * How it works:
 * - Uses router.refresh() to re-fetch server component data
 * - Polls every 10 seconds while status === "pending_review"
 * - Stops polling once status changes (approved, rejected, etc.)
 * - Cleans up interval on unmount
 */
export function StatusRefreshHandler({ status }: { status: string }) {
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only poll when status is pending_review
    if (status === "pending_review") {
      intervalRef.current = setInterval(() => {
        router.refresh();
      }, 10000); // 10 seconds
    } else {
      // Clear interval if status changed from pending to something else
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [status, router]);

  // This component doesn't render anything
  return null;
}
