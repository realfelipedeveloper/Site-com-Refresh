import RefreshPageClient from "../RefreshPageClient";

type ResetPasswordPageProps = {
  searchParams?: {
    token?: string;
  };
};

export default function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  return <RefreshPageClient recoveryModalMode="reset-password" resetToken={searchParams?.token} />;
}
