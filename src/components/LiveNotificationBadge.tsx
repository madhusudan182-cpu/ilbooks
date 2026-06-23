'use strict';
'use client';

import React from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';

interface LiveBadgeProps {
  userId: string | undefined;
}

export default function LiveNotificationBadge({ userId }: LiveBadgeProps) {
  const firestore = useFirestore();
  const [notifQuery, setNotifQuery] = React.useState<any>(null);

  React.useEffect(() => {
    if (firestore && userId) {
      setNotifQuery(
        query(
          collection(firestore, 'user_notifications'),
          where('userId', '==', userId),
          where('isRead', '==', false)
        )
      );
    }
  }, [firestore, userId]);

  const { data: notifications } = useCollection(notifQuery);
  const unreadCount = notifications ? notifications.length : 0;

  return unreadCount > 0 ? (
    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse z-50">
      {unreadCount}
    </span>
  ) : null;
}
