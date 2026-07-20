import { redirect } from "next/navigation";

export default function FriendsRedirect() {
  redirect("/dashboard/network/friends");
}
