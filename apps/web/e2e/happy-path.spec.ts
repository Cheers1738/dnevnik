import { test, expect } from "@playwright/test";

test("happy path generates artifact", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Интервью" }).click();
  await page.getByRole("button", { name: "Лучший день месяца" }).click();

  await page.getByPlaceholder("Ваш ответ").fill("Это был насыщенный день.");
  await page.getByRole("button", { name: "Отправить" }).click();

  await page.getByPlaceholder("Ваш ответ").fill("Мне помогла поддержка друзей.");
  await page.getByRole("button", { name: "Отправить" }).click();

  await page.getByPlaceholder("Ваш ответ").fill("Хочу помнить тепло.");
  await page.getByRole("button", { name: "Отправить" }).click();

  await page.getByRole("button", { name: "Создать артефакт" }).click();
  await expect(page.getByRole("heading", { level: 2 })).toContainText("Тёплый след");
});
