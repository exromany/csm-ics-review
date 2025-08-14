import { Authenticated, Refine } from "@refinedev/core";
import routerBindings, {
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes } from "react-router";
import { WagmiConfig } from "wagmi";
import "./App.css";
import { Layout } from "./components/layout";
import { AdminUserCreate, AdminUsersList } from "./pages/admin-users";
import { IcsFormDetail } from "./pages/ics-forms/detail";
import { IcsFormsList } from "./pages/ics-forms/list";
import { Login } from "./pages/login";
import { authProvider } from "./providers/authProvider";
import { dataProvider } from "./providers/dataProvider";
import { ThemeProvider } from "./providers/themeProvider";
import { config } from "./providers/wagmiConfig";
import { Toaster } from "./components/ui/sonner";

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
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
                  name: "admin-users",
                  list: "/users",
                  create: "/users/create",
                  meta: {
                    label: "User Management",
                  },
                },
              ]}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
                useNewQueryKeys: true,
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
                          <Route
                            path="/users"
                            element={<AdminUsersList />}
                          />
                          <Route
                            path="/users/create"
                            element={<AdminUserCreate />}
                          />
                        </Routes>
                      </Layout>
                    </Authenticated>
                  }
                />
              </Routes>
              <UnsavedChangesNotifier />
              <DocumentTitleHandler />
            </Refine>
            <Toaster />
          </HashRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiConfig>
  );
}

export default App;
