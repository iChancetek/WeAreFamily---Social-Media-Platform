"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createReport, ReportReason } from "@/app/actions/reporting";

interface ReportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    targetType: 'post' | 'comment' | 'group' | 'branding' | 'user';
    targetId: string;
    context?: any;
}

const REASONS: { value: ReportReason; label: string }[] = [
    { value: 'spam', label: "Spam" },
    { value: 'harassment', label: "Harassment or Bullying" },
    { value: 'hate_speech', label: "Hate Speech" },
    { value: 'nudity', label: "Nudity or Sexual Activity" },
    { value: 'violence', label: "Violence" },
    { value: 'other', label: "Something else" },
];

export function ReportDialog({ open, onOpenChange, targetType, targetId, context }: ReportDialogProps) {
    const [reason, setReason] = useState<ReportReason>('spam');
    const [details, setDetails] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await createReport(targetType, targetId, reason, details, context);
            toast.success("Report submitted. Thank you for making our community safer.");
            onOpenChange(false);
            setDetails(""); // Reset
            setReason('spam');
        } catch (error) {
            console.error("Report failed", error);
            toast.error("Failed to submit report. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        Report Content
                    </DialogTitle>
                    <DialogDescription>
                        Please select a reason why you are reporting this content.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <RadioGroup value={reason} onValueChange={(v) => setReason(v as ReportReason)}>
                        {REASONS.map((r) => (
                            <div key={r.value} className="flex items-center space-x-2">
                                <RadioGroupItem value={r.value} id={r.value} />
                                <Label htmlFor={r.value}>{r.label}</Label>
                            </div>
                        ))}
                    </RadioGroup>

                    <div className="space-y-2">
                        <Label htmlFor="details">Additional Details (Optional)</Label>
                        <Textarea
                            id="details"
                            placeholder="Please provide any extra context..."
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Report
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
