'use client';

import { useState, useEffect } from 'react';
import { Loader2, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { usersAPI } from '@/lib/api';
import type { User } from '@/lib/types';

interface TransferIssueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAssigneeId: string;
  onTransfer: (newUserId: string) => Promise<void>;
}

export function TransferIssueModal({
  open,
  onOpenChange,
  currentAssigneeId,
  onTransfer,
}: TransferIssueModalProps) {
  const [admins, setAdmins] = useState<User[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedUserId('');
    setLoadingAdmins(true);
    usersAPI.getAdminUsers()
      .then((users) => setAdmins(users.filter((u) => u.id !== currentAssigneeId)))
      .catch(() => setAdmins([]))
      .finally(() => setLoadingAdmins(false));
  }, [open, currentAssigneeId]);

  async function handleTransfer() {
    if (!selectedUserId) return;
    setIsTransferring(true);
    try {
      await onTransfer(selectedUserId);
      onOpenChange(false);
    } finally {
      setIsTransferring(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Issue</DialogTitle>
        </DialogHeader>

        <div className="py-2">
          <p className="text-sm text-muted-foreground mb-4">
            Select an IT team member to transfer this issue to. They will become the new assignee
            and will be responsible for resolving it.
          </p>

          {loadingAdmins ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : admins.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No other IT team members available.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {admins.map((admin) => (
                <button
                  key={admin.id}
                  type="button"
                  onClick={() => setSelectedUserId(admin.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    selectedUserId === admin.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="font-medium text-sm">{admin.name}</div>
                  <div className="text-xs text-muted-foreground">{admin.email}</div>
                  {admin.department && (
                    <div className="text-xs text-muted-foreground mt-0.5">{admin.department}</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isTransferring}>
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={!selectedUserId || isTransferring}
            className="gap-2"
          >
            {isTransferring ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Transferring...
              </>
            ) : (
              <>
                <ArrowRightLeft className="h-4 w-4" />
                Transfer Issue
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
