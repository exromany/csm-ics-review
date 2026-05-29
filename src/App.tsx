import { Authenticated, Refine } from "@refinedev/core";
import routerBindings, {
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes } from "react-router";
import { WagmiProvider } from "wagmi";
import "./App.css";
import { Layout } from "./components/layout";
import { AdminUserCreate, AdminUsersList } from "./pages/admin-users";
import { IcsFormDetail } from "./pages/ics-forms/detail";
import { IcsFormsList } from "./pages/ics-forms/list";
import { DvtFormDetail } from "./pages/dvt-forms/detail";
import { DvtFormsList } from "./pages/dvt-forms/list";
import { Login } from "./pages/login";
import { SettingsPage } from "./pages/settings";
import { authProvider } from "./providers/authProvider";
import { dataProvider } from "./providers/dataProvider";
import { SettingsProvider } from "./providers/settingsProvider";
import { ThemeProvider } from "./providers/themeProvider";
import { config } from "./providers/wagmiConfig";
import { Toaster } from "./components/ui/sonner";
import { appConfig } from "./config/env";
import { ComponentProps } from "react";

const queryClient = new QueryClient();

const documentTitleHandler: ComponentProps<
  typeof DocumentTitleHandler
>["handler"] = ({ resource, action, params, pathname }) => {
  const appName = appConfig.appName;
  let title = appName;

  if (resource?.meta?.label) {
    title = resource.meta.label;
    if (action === "show" && params?.id) {
      title = `${title} #${params.id}`;
    } else if (action === "create") {
      title = `Create ${title}`;
    }
    title = `${title} - ${appName}`;
  } else if (pathname === "/login") {
    title = `Login - ${appName}`;
  }

  return title;
};

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <SettingsProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <HashRouter>
            <Refine
              dataProvider={dataProvider}
              routerProvider={routerBindings}
              authProvider={authProvider}
              resources={[
                {
                  name: "ics-forms",
                  list: "/forms",
                  show: "/forms/:id",
                  meta: {
                    label: "ICS Forms",
                  },
                },
                {
                  name: "dvt-forms",
                  list: "/dvt-forms",
                  show: "/dvt-forms/:id",
                  meta: {
                    label: "DVT Forms",
                  },
                },
                {
                  name: "admin-users",
                  list: "/users",
                  create: "/users/create",
                  meta: {
                    label: "User Management",
                  },
                },
                {
                  name: "settings",
                  list: "/settings",
                  meta: {
                    label: "Settings",
                  },
                },
              ]}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
              }}
            >
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/*"
                  element={
                    <Authenticated
                      key="authenticated-routes"
                      fallback={<Login />}
                    >
                      <Layout>
                        <Routes>
                          <Route index element={<NavigateToResource />} />
                          <Route path="/forms" element={<IcsFormsList />} />
                          <Route
                            path="/forms/:id"
                            element={<IcsFormDetail />}
                          />
                          <Route path="/dvt-forms" element={<DvtFormsList />} />
                          <Route
                            path="/dvt-forms/:id"
                            element={<DvtFormDetail />}
                          />
                          <Route path="/users" element={<AdminUsersList />} />
                          <Route
                            path="/users/create"
                            element={<AdminUserCreate />}
                          />
                          <Route path="/settings" element={<SettingsPage />} />
                        </Routes>
                      </Layout>
                    </Authenticated>
                  }
                />
              </Routes>
              <UnsavedChangesNotifier />
              <DocumentTitleHandler handler={documentTitleHandler} />
            </Refine>
            <Toaster />
          </HashRouter>
        </ThemeProvider>
        </SettingsProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
