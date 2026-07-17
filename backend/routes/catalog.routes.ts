import { Router } from "express";
import { getCatalog } from "../controller/catalog.controller";
import { catalogReadLimiter } from "../middleware/rateLimiters";

const router = Router();

router.get("/", catalogReadLimiter, getCatalog);

export = router;
