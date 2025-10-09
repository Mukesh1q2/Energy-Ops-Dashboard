"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { FileText, BarChart3, HelpCircle } from "lucide-react"

export function FAQSection() {
  const faqs = [
    {
      question: "User Manual",
      answer: "Comprehensive guide covering all features of OptiBid Command Center, including optimization models, data management, report generation, and system configuration. Access the full manual in the Documentation section.",
      icon: FileText
    },
    {
      question: "Insert Charts",
      answer: "Learn how to create and customize charts for your dashboards. Upload data via Sandbox, use One-Click Plot for automatic chart suggestions, or manually configure chart types, axes, and filters to visualize your energy market data.",
      icon: BarChart3
    },
    {
      question: "How do optimization models work?",
      answer: "DMO runs once daily for day-ahead market optimization. RMO executes 48 times per day (every 30 minutes) for real-time market operations. SO runs 96 times per day (every 15 minutes) for storage optimization. Each model generates detailed reports with execution logs and key decisions.",
      icon: HelpCircle
    },
    {
      question: "What data formats are supported?",
      answer: "OptiBid supports Excel (.xlsx, .xls), CSV, and JSON formats. Upload files through the Sandbox to automatically map headers and run optimization models. Ensure your data includes required fields for generation, pricing, and capacity information.",
      icon: HelpCircle
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5" />
          Frequently Asked Questions
        </CardTitle>
        <CardDescription>
          Quick answers to common questions about OptiBid Command Center
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => {
            const Icon = faq.icon
            return (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="font-medium">{faq.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </CardContent>
    </Card>
  )
}
