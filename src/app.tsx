import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import "./app.css";
import 'mdui/mdui.css';

declare module 'solid-js' {
    namespace JSX {
        type ElementProps<T> = {
            // Add both the element's prefixed properties and the attributes
            [K in keyof T]: Props<T[K]> & HTMLAttributes<T[K]>;
        }
        // Prefixes all properties with `prop:` to match Solid's property setting syntax
        type Props<T> = {
            [K in keyof T as `prop:${string & K}`]?: T[K];
        }

        interface IntrinsicElements extends ElementProps<HTMLElementTagNameMap> {
        }
    }
}

export default function App() {
  return (
    <Router
      root={props => (
        <MetaProvider>
          <Title>boomboom</Title>
          <Suspense>{props.children}</Suspense>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
