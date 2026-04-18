import { CheckoutView } from "@/components/checkout/CheckoutView";

type Props = { params: Promise<{ courseId: string }> };

export default async function CheckoutPage({ params }: Props) {
  const { courseId } = await params;
  return <CheckoutView courseId={courseId} />;
}
