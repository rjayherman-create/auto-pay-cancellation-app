import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { useGetRecurringPayments, useGenerateEmailTemplate, useGenerateAchRevocation, useGenerateStopPayment } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Copy, FileText, Check } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";

export default function Documents() {
  const { user } = useAuth();
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialPaymentId = searchParams.get('paymentId');
  const initialType = searchParams.get('type') || 'email';
  
  const [paymentId, setPaymentId] = useState<string>(initialPaymentId || "");
  const [docType, setDocType] = useState<string>(initialType);
  const [generatedText, setGeneratedText] = useState("");
  const [instructions, setInstructions] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const { data: payments } = useGetRecurringPayments();
  
  const generateEmail = useGenerateEmailTemplate();
  const generateAch = useGenerateAchRevocation();
  const generateStop = useGenerateStopPayment();

  const isPending = generateEmail.isPending || generateAch.isPending || generateStop.isPending;

  const handleGenerate = async () => {
    if (!paymentId) return;
    setGeneratedText("");
    setInstructions([]);
    setCopied(false);

    try {
      if (docType === 'email') {
        const res = await generateEmail.mutateAsync({ 
          data: { paymentId: Number(paymentId), userName: user?.name || '', userEmail: user?.email || '' } 
        });
        setGeneratedText(`Subject: ${res.subject}\n\n${res.body}`);
        setInstructions(["Copy this email text", "Send it to the merchant's support email", "Keep a copy of the sent email for your records"]);
      } else if (docType === 'ach') {
        const res = await generateAch.mutateAsync({
           data: { paymentId: Number(paymentId), userName: user?.name || '', bankName: "Your Bank", accountLastFour: "XXXX" }
        });
        setGeneratedText(res.content);
        setInstructions(res.instructions);
      } else {
        const res = await generateStop.mutateAsync({
           data: { paymentId: Number(paymentId), userName: user?.name || '', bankName: "Your Bank", accountLastFour: "XXXX" }
        });
        setGeneratedText(res.content);
        setInstructions(res.instructions);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Legal Documents</h1>
        <p className="text-muted-foreground mt-2">Generate official templates to enforce cancellations.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <Card className="shadow-sm border-border/50 rounded-2xl">
            <CardHeader>
              <CardTitle>Generator Settings</CardTitle>
              <CardDescription>Select a subscription to build the document</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Subscription</label>
                <Select value={paymentId} onValueChange={setPaymentId}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Choose one..." />
                  </SelectTrigger>
                  <SelectContent>
                    {payments?.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.merchantName} - ${p.amount}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Document Type</label>
                <Tabs value={docType} onValueChange={setDocType} className="w-full">
                  <TabsList className="grid w-full grid-cols-1 h-auto gap-1 bg-transparent">
                    <TabsTrigger value="email" className="data-[state=active]:bg-primary data-[state=active]:text-white border border-slate-200">Email Template</TabsTrigger>
                    <TabsTrigger value="ach" className="data-[state=active]:bg-primary data-[state=active]:text-white border border-slate-200">ACH Revocation</TabsTrigger>
                    <TabsTrigger value="stop" className="data-[state=active]:bg-primary data-[state=active]:text-white border border-slate-200">Stop Payment</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <Button onClick={handleGenerate} disabled={!paymentId || isPending} className="w-full h-12 shadow-md shadow-primary/20">
                {isPending ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <FileText className="h-5 w-5 mr-2" />}
                Generate Document
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8">
          <Card className="shadow-sm border-border/50 rounded-2xl h-full min-h-[500px] flex flex-col overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
               <div>
                 <CardTitle className="text-lg">Generated Output</CardTitle>
               </div>
               {generatedText && (
                 <Button variant="outline" size="sm" onClick={copyToClipboard} className="bg-white">
                   {copied ? <Check className="h-4 w-4 mr-2 text-emerald-500" /> : <Copy className="h-4 w-4 mr-2" />}
                   {copied ? "Copied!" : "Copy to Clipboard"}
                 </Button>
               )}
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col relative">
               {!generatedText ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                   <FileText className="h-16 w-16 mb-4 opacity-20" />
                   <p className="text-lg font-medium text-slate-500">Document preview will appear here</p>
                   <p className="text-sm">Select options on the left and click Generate.</p>
                 </div>
               ) : (
                 <div className="flex flex-col h-full">
                   {instructions.length > 0 && (
                     <div className="bg-blue-50/50 border-b border-blue-100 p-4 px-6 text-sm">
                       <h4 className="font-bold text-blue-900 mb-2">Instructions</h4>
                       <ul className="list-disc pl-5 space-y-1 text-blue-800/80">
                         {instructions.map((inst, i) => <li key={i}>{inst}</li>)}
                       </ul>
                     </div>
                   )}
                   <div className="p-6 flex-1 bg-white">
                     <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700 bg-slate-50 border border-slate-100 p-6 rounded-xl h-full">
                       {generatedText}
                     </pre>
                   </div>
                 </div>
               )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
