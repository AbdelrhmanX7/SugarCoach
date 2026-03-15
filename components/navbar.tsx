import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarBrand,
  NavbarItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import NextLink from "next/link";

import { ThemeSwitch } from "@/components/theme-switch";

export const Navbar = () => {
  return (
    <HeroUINavbar maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-2" href="/">
            <span aria-label="candy" className="text-2xl" role="img">
              🍬
            </span>
            <p className="font-bold text-inherit text-lg">SugarCoach</p>
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="flex basis-1/5 sm:basis-full" justify="end">
        <NavbarItem className="flex gap-2 items-center">
          <ThemeSwitch />
          <Button as={Link} href="/login" size="sm" variant="light">
            Login
          </Button>
          <Button
            as={Link}
            color="primary"
            href="/register"
            size="sm"
            variant="flat"
          >
            Register
          </Button>
        </NavbarItem>
      </NavbarContent>
    </HeroUINavbar>
  );
};
