import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does it work?",
    answer: "Simply enter your draft headline into the text box and click 'Fix my headline'. Our AI, trained on millions of high-performing headlines, will analyze your input and generate 10 optimized variations based on proven copywriting formulas for engagement and clarity."
  },
  {
    question: "Is this tool really free?",
    answer: "Yes, the core headline generation feature is completely free to use. We offer it as a way to demonstrate the power of our AI tools. In the future, we will introduce premium 'Pro' features for users who need more advanced capabilities."
  },
  {
    question: "How do I save my favorite headlines?",
    answer: "Next to each generated headline, you'll see a star icon. Click the star to save a headline as a favorite. Your favorites are stored locally in your browser, so you can come back to them later. For permanent, cross-device saving, you'll need to create a free account (coming soon)."
  },
  {
    question: "How do I export the generated headlines?",
    answer: "Once the headlines are generated, you'll see 'TXT' and 'CSV' export buttons appear above the results. Click on your desired format to download a file containing all 10 variations."
  },
];

export default function FAQPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="font-headline text-4xl font-bold">Frequently Asked Questions</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Can't find the answer you're looking for? Reach out to our support team.
        </p>
      </div>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem value={`item-${index}`} key={index}>
            <AccordionTrigger className="text-left text-lg">{faq.question}</AccordionTrigger>
            <AccordionContent className="text-base text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
