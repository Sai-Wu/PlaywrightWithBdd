import { createBdd } from "playwright-bdd";
import { bddTest } from "../support/fixture";

const { Given, When, Then } = createBdd(bddTest);

