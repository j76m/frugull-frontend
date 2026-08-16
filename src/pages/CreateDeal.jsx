import AppLayout from '../components/AppLayout';
import TopNav from '../components/TopNav';

export default function CreateDeal() {
  return (
    <AppLayout>
      <TopNav />
      <div className="flex flex-col items-center justify-center py-24 text-center px-6">
        <p className="text-brand-navy font-medium">Post a deal</p>
        <p className="text-brand-gray text-sm mt-1">
          Step 4: camera capture → S3 upload → deal form.
        </p>
      </div>
    </AppLayout>
  );
}
