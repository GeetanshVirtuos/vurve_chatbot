import { LoaderFunctionArgs } from "@remix-run/node";
import { login } from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw await login(request);
  }

  return new Response("Please add ?shop=your-shop-domain.myshopify.com to the URL");
}
