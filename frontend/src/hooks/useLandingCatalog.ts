import { useEffect, useMemo, useState } from "react";
import { getCatalog, type CatalogResponse } from "../services/api";
import {
  isLandingCatalog,
  landingBarbers,
  landingServices,
} from "../sections/user/home/landingCatalog";
import { groupServicesByName } from "../sections/user/home/servicesUtils";

type CatalogState = {
  status: "loading" | "live" | "fallback";
  catalog: CatalogResponse;
};

const FALLBACK_CATALOG: CatalogResponse = {
  barbers: landingBarbers,
  services: landingServices,
};

export const useLandingCatalog = () => {
  const [state, setState] = useState<CatalogState>({
    status: "loading",
    catalog: { barbers: [], services: [] },
  });

  useEffect(() => {
    const controller = new AbortController();
    let settled = false;

    const finish = (nextState: CatalogState) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      setState(nextState);
    };

    const timeout = setTimeout(() => {
      finish({ status: "fallback", catalog: FALLBACK_CATALOG });
      controller.abort();
    }, 5_000);

    void getCatalog({ signal: controller.signal })
      .then((catalog) => {
        if (!isLandingCatalog(catalog)) {
          throw new Error("Invalid landing catalog response");
        }
        finish({ status: "live", catalog });
      })
      .catch(() => {
        finish({ status: "fallback", catalog: FALLBACK_CATALOG });
      });

    return () => {
      settled = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  const groupedServices = useMemo(
    () => groupServicesByName(state.catalog.services),
    [state.catalog.services],
  );

  return {
    barbers: state.catalog.barbers,
    services: state.catalog.services,
    groupedServices,
    loading: state.status === "loading",
    preview: state.status === "fallback",
  };
};
