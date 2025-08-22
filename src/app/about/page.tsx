export default function AboutPage() {
  return (
    <div className="bg-card py-24 sm:py-32">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="text-center">
          <h1 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl">
            The Story Behind the Tool
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Built by a solo developer to solve a common creator problem.
          </p>
        </div>
        <div className="mt-16 space-y-6 text-lg leading-relaxed text-muted-foreground">
          <p>
            In a world saturated with content, a great headline is no longer a
            "nice-to-have"—it's a necessity. It's the first, and often only,
            chance you get to grab your reader's attention. A powerful headline
            stops the scroll, sparks curiosity, and invites readers into your
            world. A weak one gets lost in the noise.
          </p>
          <p>
            I built Headline Optimizer out of a personal frustration. As a
            content creator myself, I've spent countless hours staring at a
            blinking cursor, trying to brainstorm the perfect headline. I knew
            there had to be a better, faster way to move from a dull draft to a
            click-worthy title. I wanted a tool that was fast, intelligent, and
            didn't require a steep learning curve.
          </p>
          <p>
            This app combines the power of advanced AI with proven copywriting
            principles to give you an instant creative boost. It's not about
            replacing your creativity, but augmenting it. Use it to brainstorm,
            to get unstuck, or to find that one perfect angle you hadn't
            considered.
          </p>
          <p className="font-semibold text-foreground">
            My mission is simple: to help creators like you make a bigger impact
            with your words. Thank you for trying it out.
          </p>
        </div>
      </div>
    </div>
  );
}
