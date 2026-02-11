"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Layers,
  GitBranch,
  ShieldCheck,
  Activity,
  Zap,
  BarChart3,
  AlertTriangle,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  Eye,
  TrendingUp,
  Grid3X3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KERNEL_STATE_CONFIG, KernelStateName } from "@/hooks/use-kernel-data";

interface KernelExplainerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Section({
  icon: Icon,
  title,
  iconColor,
  children,
}: {
  icon: React.ElementType;
  title: string;
  iconColor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", iconColor)} />
        <h3 className="font-semibold text-white text-sm">{title}</h3>
      </div>
      <div className="text-slate-300 text-[13px] leading-relaxed pl-6">
        {children}
      </div>
    </div>
  );
}

function PipelineStep({
  step,
  title,
  description,
  color,
}: {
  step: string;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className="flex gap-3">
      <div className={cn("flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold", color)}>
        {step}
      </div>
      <div>
        <div className="text-white text-sm font-medium">{title}</div>
        <div className="text-slate-400 text-xs leading-relaxed">{description}</div>
      </div>
    </div>
  );
}

const STATE_GROUPS = [
  {
    label: "Normal",
    states: ["STABLE"] as KernelStateName[],
    description: "Equipment operating within all expected parameters",
  },
  {
    label: "Operational Events",
    states: ["DOOR_OPEN", "RECOVERING", "DEFROST"] as KernelStateName[],
    description: "Expected events that temporarily affect temperature",
  },
  {
    label: "Drift",
    states: ["DRIFT_WARM", "DRIFT_COLD"] as KernelStateName[],
    description: "Gradual trends that may indicate developing issues",
  },
  {
    label: "Critical",
    states: ["EXCURSION", "COMP_STRESS", "FAULT"] as KernelStateName[],
    description: "Conditions requiring immediate attention",
  },
];

export function KernelExplainerModal({ open, onOpenChange }: KernelExplainerModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 text-white p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Brain className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <DialogTitle className="text-white text-lg">How Kernel Signal Intelligence Works</DialogTitle>
              <DialogDescription className="text-slate-400 text-sm">
                Understanding the classification pipeline and what the data means
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] px-6 py-5">
          <div className="space-y-6">

            {/* The Problem */}
            <Section icon={Eye} title="The Problem" iconColor="text-amber-400">
              <p>
                Traditional cold chain monitoring gives you raw numbers &mdash; temperature, power, door state &mdash; and leaves the interpretation to humans. An operator seeing -16&deg;C has to mentally determine: <em>is this a door that was just opened? A compressor struggling? A defrost cycle? Or a real excursion?</em>
              </p>
              <p className="mt-2">
                Kernel eliminates that guesswork. It watches the same sensor streams, but instead of showing raw data, it tells you <strong>what the equipment is actually doing</strong> and whether that behaviour is normal <em>for this specific unit at this time of day</em>.
              </p>
            </Section>

            <Separator className="bg-slate-700/50" />

            {/* The 4-Layer Pipeline */}
            <Section icon={Layers} title="The 4-Layer Classification Pipeline" iconColor="text-violet-400">
              <p className="mb-3">Every 5 seconds, each device&apos;s sensor data flows through four layers:</p>

              <div className="space-y-3">
                <PipelineStep
                  step="1"
                  title="Feature Extraction"
                  description="Raw sensor readings (temperature, power, frequency, door state) are transformed into 15 derived features that capture trends, volatility, and cross-sensor correlations. For example: is temperature rising fast while power is already maxed out? That's different from temperature rising because a door just opened."
                  color="bg-blue-500/20 text-blue-400"
                />
                <div className="pl-3">
                  <ArrowDown className="h-3 w-3 text-slate-600" />
                </div>
                <PipelineStep
                  step="2"
                  title="Rule Engine (Deterministic)"
                  description="Clear-cut states are identified instantly with 100% confidence: a fault code means FAULT, an active defrost cycle means DEFROST, an open door sensor means DOOR_OPEN. No ML needed — these are hardware-reported facts."
                  color="bg-green-500/20 text-green-400"
                />
                <div className="pl-3">
                  <ArrowDown className="h-3 w-3 text-slate-600" />
                </div>
                <PipelineStep
                  step="3"
                  title="Neural Network (Ambiguous States)"
                  description="When rules can't decide — is this a warm drift or an early excursion? compressor stress or just high load? — a trained MLP classifier (95.2% accuracy) analyses the 15 features and assigns probabilities across all 9 states. The model was trained on 12,000 labelled scenarios covering every operational condition."
                  color="bg-violet-500/20 text-violet-400"
                />
                <div className="pl-3">
                  <ArrowDown className="h-3 w-3 text-slate-600" />
                </div>
                <PipelineStep
                  step="4"
                  title="Sensor Cross-Validation"
                  description="The classified state is checked against the raw physics. If the model says STABLE but temperature volatility is high, the consistency score drops. This catches edge cases and gives you a trust metric for every classification."
                  color="bg-cyan-500/20 text-cyan-400"
                />
              </div>
            </Section>

            <Separator className="bg-slate-700/50" />

            {/* The 9 States */}
            <Section icon={Activity} title="The 9 Operational States" iconColor="text-green-400">
              <p className="mb-3">Every classification maps to one of 9 states, grouped by severity:</p>
              <div className="space-y-3">
                {STATE_GROUPS.map((group) => (
                  <div key={group.label}>
                    <div className="text-xs font-medium text-slate-500 uppercase mb-1">{group.label}</div>
                    <div className="flex flex-wrap gap-1.5 mb-1">
                      {group.states.map((state) => {
                        const config = KERNEL_STATE_CONFIG[state];
                        return (
                          <Badge
                            key={state}
                            className={cn("text-xs border-0", config.bgColor, config.textColor)}
                          >
                            {config.label}
                          </Badge>
                        );
                      })}
                    </div>
                    <div className="text-xs text-slate-500">{group.description}</div>
                  </div>
                ))}
              </div>
            </Section>

            <Separator className="bg-slate-700/50" />

            {/* Markov Learning */}
            <Section icon={GitBranch} title="Markov Learning Engine" iconColor="text-pink-400">
              <p>
                This is what makes Kernel adaptive. The Markov engine doesn&apos;t just classify &mdash; it <strong>learns what&apos;s normal for each specific device</strong>.
              </p>
              <p className="mt-2">
                It builds a probability matrix of state transitions: how often does this unit go from STABLE to DOOR_OPEN? How quickly does it RECOVER? Does it DRIFT_WARM on hot afternoons?
              </p>
              <p className="mt-2">
                Once the model matures, it uses these learned baselines to <strong>detect anomalies</strong>. If a unit suddenly transitions from STABLE directly to COMP_STRESS &mdash; something it has never done before &mdash; Kernel flags it as unusual, even though compressor stress might be &quot;normal&quot; on a different unit.
              </p>

              <div className="mt-3 bg-slate-800/50 rounded-lg p-3 space-y-2">
                <div className="text-xs font-medium text-slate-400">Maturity Levels</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { level: "Learning", desc: "Collecting initial data, no anomaly detection yet", color: "text-slate-400" },
                    { level: "Developing", desc: "Building baselines, basic patterns emerging", color: "text-blue-400" },
                    { level: "Mature", desc: "Reliable baselines, anomaly detection active", color: "text-violet-400" },
                    { level: "Established", desc: "High-confidence model, time-of-day patterns learned", color: "text-green-400" },
                  ].map((m) => (
                    <div key={m.level} className="flex items-start gap-2">
                      <span className={cn("text-xs font-mono font-medium", m.color)}>{m.level}</span>
                      <span className="text-[11px] text-slate-500">{m.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            <Separator className="bg-slate-700/50" />

            {/* Reading the Dashboard */}
            <Section icon={BarChart3} title="Reading the Dashboard" iconColor="text-blue-400">
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Activity className="h-3 w-3 text-violet-400" />
                    <span className="text-white text-xs font-medium">Device List</span>
                  </div>
                  <p className="text-xs text-slate-400">Each device shows its current state as a coloured badge. Click a device to see its detailed analysis below.</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp className="h-3 w-3 text-blue-400" />
                    <span className="text-white text-xs font-medium">State Timeline</span>
                  </div>
                  <p className="text-xs text-slate-400">A horizontal bar showing how the device&apos;s state has changed over time. Long stretches of green (STABLE) are good. Frequent colour changes suggest instability.</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Zap className="h-3 w-3 text-green-400" />
                    <span className="text-white text-xs font-medium">Feature Dashboard</span>
                  </div>
                  <p className="text-xs text-slate-400">The 15 derived features with sparkline trends. This is the &quot;reasoning&quot; behind each classification &mdash; you can see exactly which inputs drove the decision.</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="h-3 w-3 text-green-400" />
                    <span className="text-white text-xs font-medium">Health &amp; Confidence</span>
                  </div>
                  <p className="text-xs text-slate-400"><strong>Confidence</strong> = how certain the classifier is. <strong>Sensor Consistency</strong> = whether the raw physics match the classified state. <strong>Method</strong> shows whether rules or ML made the call. High scores on all three = high trust in the classification.</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Grid3X3 className="h-3 w-3 text-pink-400" />
                    <span className="text-white text-xs font-medium">Markov Heatmap</span>
                  </div>
                  <p className="text-xs text-slate-400">A 9&times;9 grid showing learned transition probabilities. Darker cells = more frequent transitions. Pulsing amber cells = transitions that just happened. This is the device&apos;s &quot;behavioural fingerprint&quot;.</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="h-3 w-3 text-amber-400" />
                    <span className="text-white text-xs font-medium">Alert Feed</span>
                  </div>
                  <p className="text-xs text-slate-400">Markov anomalies appear here: state transitions that have never or rarely been observed for this specific device. These are the &quot;something just changed&quot; signals that are invisible to threshold-based systems.</p>
                </div>
              </div>
            </Section>

            <Separator className="bg-slate-700/50" />

            {/* Why This Matters */}
            <Section icon={CheckCircle2} title="Why This Matters" iconColor="text-emerald-400">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <ArrowRight className="h-3 w-3 text-emerald-400 mt-1 flex-shrink-0" />
                  <p><strong className="text-white">Catch problems before they escalate.</strong> A warm drift detected at -17&deg;C gives you hours to act. A threshold alarm at -5&deg;C means the product is already compromised.</p>
                </div>
                <div className="flex items-start gap-2">
                  <ArrowRight className="h-3 w-3 text-emerald-400 mt-1 flex-shrink-0" />
                  <p><strong className="text-white">Eliminate false alarms.</strong> A door opening is not a crisis &mdash; it&apos;s a door opening. Kernel knows the difference and won&apos;t page your team at 3am for a routine event.</p>
                </div>
                <div className="flex items-start gap-2">
                  <ArrowRight className="h-3 w-3 text-emerald-400 mt-1 flex-shrink-0" />
                  <p><strong className="text-white">Per-device intelligence.</strong> The Markov engine learns that Unit A gets opened 12 times a day (it&apos;s in a busy kitchen) while Unit B is opened twice a week (it&apos;s long-term storage). The same event is normal for one and alarming for the other.</p>
                </div>
                <div className="flex items-start gap-2">
                  <ArrowRight className="h-3 w-3 text-emerald-400 mt-1 flex-shrink-0" />
                  <p><strong className="text-white">Full explainability.</strong> Every classification shows its confidence, method (rule vs. ML), sensor consistency, and the 15 features that drove the decision. No black boxes &mdash; auditors and regulators can trace every conclusion back to the raw data.</p>
                </div>
                <div className="flex items-start gap-2">
                  <ArrowRight className="h-3 w-3 text-emerald-400 mt-1 flex-shrink-0" />
                  <p><strong className="text-white">Runs on the device.</strong> The classifier is 5KB &mdash; small enough to run on a microcontroller. Edge intelligence means classifications happen in real-time without internet dependency, and only verified, annotated data is transmitted.</p>
                </div>
              </div>
            </Section>

            <Separator className="bg-slate-700/50" />

            {/* Technical Specs */}
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-xs font-medium text-slate-400 mb-2">Technical Specifications</div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Classifier</span>
                  <span className="text-white font-mono">MLP 15-32-16-9</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Accuracy</span>
                  <span className="text-white font-mono">95.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Model Size</span>
                  <span className="text-white font-mono">5.1 KB (INT8)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Parameters</span>
                  <span className="text-white font-mono">1,193</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Features</span>
                  <span className="text-white font-mono">15 derived</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">States</span>
                  <span className="text-white font-mono">9 classes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Critical Recall</span>
                  <span className="text-white font-mono">&ge;95%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Classification</span>
                  <span className="text-white font-mono">5s interval</span>
                </div>
              </div>
            </div>

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
