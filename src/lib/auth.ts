import { mockUsers } from './data';
import type { User } from './types';

// To switch between an admin and user view, change the index here.
// mockUsers[0] is an admin.
// mockUsers[1], mockUsers[2], mockUsers[3] are regular users.
// mockUsers[4] is Paban Alam.
export const currentUser: User = mockUsers[0];
