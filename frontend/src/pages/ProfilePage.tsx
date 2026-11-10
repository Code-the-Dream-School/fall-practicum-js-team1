import type { ComponentProps } from 'react';
import {
  CircleCheck,
  Clock,
  HandHeart,
  Hourglass,
  Package,
  PackageCheck,
} from 'lucide-react';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  cancelClaim,
  getItemClaims,
  getMyClaims,
  getMyItems,
  getMyStats,
  restoreItem,
  updateClaim,
  updateClaimNoShow,
  updateClaimPickedUp,
  withdrawItem,
} from '@/api/client';
import { ClaimsSection } from '@/components/profile/ClaimsSection';
import { DonationsSection } from '@/components/profile/DonationsSection';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import type { Decision } from '@/components/profile/types';
import { useAuthStore } from '@/store/authStore';

// one profile action and the message for the toast
type ProfileAction = { run: () => unknown; message: string };

export default function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);

  // the tab lives in the url so a refresh or a shared link opens the same one
  const tab = searchParams.get('tab') === 'claims' ? 'claims' : 'donations';

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useQuery({ queryKey: ['profile', 'stats'], queryFn: getMyStats });

  const {
    data: items = [],
    isLoading: itemsLoading,
    isError: itemsError,
    refetch: refetchItems,
  } = useQuery({ queryKey: ['profile', 'items'], queryFn: getMyItems });

  const {
    data: claims = [],
    isLoading: claimsLoading,
    isError: claimsError,
    refetch: refetchClaims,
  } = useQuery({
    queryKey: ['profile', 'claims'],
    queryFn: () => getMyClaims(),
  });

  // who requested each of my items, the ids are in the key so a new item fetches again
  const itemIds = items.map((item) => item.id);
  const { data: requests = {} } = useQuery({
    queryKey: ['profile', 'requests', itemIds],
    queryFn: async () => {
      const lists = await Promise.all(
        itemIds.map((id) => getItemClaims({ itemId: id })),
      );
      return Object.fromEntries(itemIds.map((id, index) => [id, lists[index]]));
    },
    enabled: itemIds.length > 0,
  });

  // runs one of the actions, shows a toast, then every profile query reads again
  const { mutate: runAction } = useMutation({
    mutationFn: async (action: ProfileAction) => {
      await action.run();
      return action.message;
    },
    onSuccess: (message) => toast.success(message),
    onError: (error) => toast.error(error.message),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const donationStats = [
    { label: 'Posted', value: stats?.donations.posted ?? 0, icon: Package },
    {
      label: 'Waiting for you',
      value: stats?.donations.waitingForYou ?? 0,
      icon: Clock,
    },
    {
      label: 'Approved',
      value: stats?.donations.approved ?? 0,
      icon: CircleCheck,
    },
    {
      label: 'Picked up',
      value: stats?.donations.pickedUp ?? 0,
      icon: PackageCheck,
    },
  ];

  const claimStats = [
    {
      label: 'Requested',
      value: stats?.claims.requested ?? 0,
      icon: HandHeart,
    },
    {
      label: 'Waiting for owner',
      value: stats?.claims.waitingForOwner ?? 0,
      icon: Hourglass,
    },
    {
      label: 'Approved',
      value: stats?.claims.approved ?? 0,
      icon: CircleCheck,
    },
    {
      label: 'Picked up',
      value: stats?.claims.pickedUp ?? 0,
      icon: PackageCheck,
    },
  ];

  const tabs = [
    {
      value: 'donations',
      label: 'My donations',
      count: stats?.donations.posted ?? 0,
    },
    {
      value: 'claims',
      label: 'My claims',
      count: stats?.claims.requested ?? 0,
    },
  ];

  const handleTab = (value: string) => {
    setSearchParams(value === 'claims' ? { tab: value } : {}, {
      replace: true,
    });
  };

  // everything the owner can do with their items and the requests on them
  const donationActions = {
    onDecision: (claimId: string, decision: Decision) =>
      runAction({
        run: () => updateClaim({ claimId, status: decision }),
        message:
          decision === 'approved' ? 'Request approved' : 'Request declined',
      }),
    onPickedUp: (itemId: string) =>
      runAction({
        run: () => updateClaimPickedUp({ itemId }),
        message: 'Marked as picked up',
      }),
    onNoShow: (claimId: string) =>
      runAction({
        run: () => updateClaimNoShow({ claimId }),
        message: 'Marked as no-show',
      }),
    onWithdraw: (itemId: string) =>
      runAction({
        run: () => withdrawItem({ itemId }),
        message: 'Item withdrawn',
      }),
    onRestore: (itemId: string) =>
      runAction({
        run: () => restoreItem({ itemId }),
        message: 'Item restored',
      }),
  };

  // the person who asked for an item changes their mind
  const handleCancel = (claimId: string) =>
    runAction({
      run: () => cancelClaim({ claimId }),
      message: 'Request cancelled',
    });

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-10 lg:py-14">
      <ProfileHeader name={user.name} />

      <ProfileTabs tabs={tabs} current={tab} onChange={handleTab} />

      <div id="profile-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'donations' ? (
          <DonationsSection
            stats={donationStats}
            items={items as ComponentProps<typeof DonationsSection>['items']}
            requests={
              requests as ComponentProps<typeof DonationsSection>['requests']
            }
            isLoading={itemsLoading || statsLoading}
            isError={itemsError || statsError}
            onRetry={() => {
              refetchItems();
              refetchStats();
            }}
            onPostItem={() => navigate('/items/new')}
            actions={donationActions}
          />
        ) : (
          <ClaimsSection
            stats={claimStats}
            claims={claims as ComponentProps<typeof ClaimsSection>['claims']}
            isLoading={claimsLoading || statsLoading}
            isError={claimsError || statsError}
            onRetry={() => {
              refetchClaims();
              refetchStats();
            }}
            onBrowse={() => navigate('/')}
            onCancel={handleCancel}
          />
        )}
      </div>
    </div>
  );
}
