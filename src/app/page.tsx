import { createClient } from "@/lib/supabase/server";
import { getCategoriesWithNominees, getCategoryResults, getVotingOpen, getUserVotes, hasUserVoted } from "@/lib/queries";
import MainApp from "@/components/MainApp";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const [categories, results, votingOpen, userVotes, userHasVoted] = await Promise.all([
    getCategoriesWithNominees(),
    getCategoryResults(),
    getVotingOpen(),
    getUserVotes(),
    hasUserVoted()
  ]);

  return (
    <MainApp
      categories={categories}
      results={results}
      userVotes={userVotes}
      votingOpen={votingOpen}
      user={user}
      userHasVoted={userHasVoted}
    />
  );
}