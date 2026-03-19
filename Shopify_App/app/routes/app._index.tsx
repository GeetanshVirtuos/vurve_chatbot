import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Button,
  Banner,
  Text,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { useState, useCallback } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);

  let config = await prisma.shopConfig.findUnique({
    where: { shop: session.shop },
  });

  if (!config) {
    config = await prisma.shopConfig.create({
      data: {
        shop: session.shop,
        apiUrl: process.env.BACKEND_API_URL || "http://localhost:8000/api/v1/talk",
        widgetEnabled: true,
      },
    });
  }

  return json({
    config: {
      apiUrl: config.apiUrl,
      widgetEnabled: config.widgetEnabled,
    },
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const apiUrl = formData.get("apiUrl") as string;
  const widgetEnabled = formData.get("widgetEnabled") === "true";

  await prisma.shopConfig.upsert({
    where: { shop: session.shop },
    update: { apiUrl, widgetEnabled },
    create: {
      shop: session.shop,
      apiUrl,
      widgetEnabled,
    },
  });

  return json({ success: true });
}

export default function Index() {
  const { config } = useLoaderData<typeof loader>();
  const submit = useSubmit();

  const [apiUrl, setApiUrl] = useState(config.apiUrl);
  const [saved, setSaved] = useState(false);

  const handleSubmit = useCallback(() => {
    const formData = new FormData();
    formData.append("apiUrl", apiUrl);
    formData.append("widgetEnabled", String(config.widgetEnabled));
    submit(formData, { method: "post" });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }, [apiUrl, config.widgetEnabled, submit]);

  return (
    <Page
      title="GiftCart Chatbot Settings"
      subtitle="Configure your AI chatbot for your store"
    >
      <Layout>
        <Layout.Section>
          {saved && (
            <Banner tone="success" onDismiss={() => setSaved(false)}>
              Settings saved successfully!
            </Banner>
          )}
        </Layout.Section>

        <Layout.Section>
          <Card>
            <div style={{ padding: "20px" }}>
              <FormLayout>
                <Text variant="headingMd" as="h2">
                  API Configuration
                </Text>
                <TextField
                  label="Backend API URL"
                  value={apiUrl}
                  onChange={setApiUrl}
                  helpText="The URL of your FastAPI backend endpoint"
                  autoComplete="off"
                />
                <Button variant="primary" onClick={handleSubmit}>
                  Save Settings
                </Button>
              </FormLayout>
            </div>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <div style={{ padding: "20px" }}>
              <Text variant="headingMd" as="h2">
                Installation Instructions
              </Text>
              <div style={{ marginTop: "16px" }}>
                <Text as="p">
                  1. Go to <strong>Online Store → Themes → Customize</strong>
                </Text>
                <Text as="p">
                  2. In the left sidebar, find <strong>App embeds</strong>
                </Text>
                <Text as="p">
                  3. Enable <strong>GiftCart Chatbot Widget</strong>
                </Text>
                <Text as="p">
                  4. Save your theme
                </Text>
              </div>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
