import { MainLayout } from '@/components/layout/MainLayout';
import { WikiPageSkeleton } from '@/components/wiki/WikiPageSkeleton';

export default function WikiLoading() {
  return (
    <MainLayout disableScroll={true}>
      <WikiPageSkeleton />
    </MainLayout>
  );
}
