"use client";

import * as React from "react";
import { useBodyTrackerData, HR_ZONE_CONFIG } from "@/hooks/use-body-tracker-data";
import { BodyTrackerChat } from "@/components/body-tracker-chat";
import { EcgChart } from "@/components/ecg-chart";
import { AccelChart } from "@/components/accel-chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Activity,
  Timer,
  Footprints,
  Flame,
  Battery,
  Wifi,
  WifiOff,
  TrendingUp,
  ArrowUpDown,
  Zap,
  RotateCcw,
  Wind,
  AlertCircle,
  CheckCircle,
  Home,
  Moon,
  Sofa,
  Dumbbell,
  Mail,
  Send,
  Settings,
  Sparkles,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function BodyTrackerDashboard() {
  const {
    history,
    latest,
    isConnected,
    isOnline,
    simulatorRunning,
    avgHeartRate,
    maxHeartRate,
    avgHRV,
    evaluateTorsoLean,
    evaluateVerticalOscillation,
    evaluateImpactGForce,
    evaluateTorsoRotation,
    evaluateCadence,
    evaluateHRV,
    formatDuration,
  } = useBodyTrackerData();

  const [currentMode, setCurrentMode] = React.useState<string>('exercise');
  const [isChangingMode, setIsChangingMode] = React.useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [appPassword, setAppPassword] = React.useState('');
  const [emailConfigured, setEmailConfigured] = React.useState(false);
  const [isSendingEmail, setIsSendingEmail] = React.useState(false);
  const [isConfiguringEmail, setIsConfiguringEmail] = React.useState(false);
  const [insights, setInsights] = React.useState<string | null>(null);
  const [insightsLoading, setInsightsLoading] = React.useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  // Fetch current mode on mount
  React.useEffect(() => {
    fetch(`${apiUrl}/api/body-tracker/mode`)
      .then(res => res.json())
      .then(data => setCurrentMode(data.mode))
      .catch(console.error);

    fetch(`${apiUrl}/api/body-tracker/email/status`)
      .then(res => res.json())
      .then(data => setEmailConfigured(data.configured))
      .catch(console.error);
  }, [apiUrl]);

  const changeMode = async (mode: string) => {
    setIsChangingMode(true);
    try {
      const res = await fetch(`${apiUrl}/api/body-tracker/mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      if (res.ok) {
        setCurrentMode(mode);
      }
    } catch (error) {
      console.error('Failed to change mode:', error);
    }
    setIsChangingMode(false);
  };

  const configureEmail = async () => {
    if (!email || !appPassword) return;
    setIsConfiguringEmail(true);
    try {
      const res = await fetch(`${apiUrl}/api/body-tracker/email/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, appPassword })
      });
      if (res.ok) {
        setEmailConfigured(true);
        setEmailDialogOpen(false);
        setAppPassword('');
      }
    } catch (error) {
      console.error('Failed to configure email:', error);
    }
    setIsConfiguringEmail(false);
  };

  const sendReport = async () => {
    setIsSendingEmail(true);
    try {
      const res = await fetch(`${apiUrl}/api/body-tracker/email/send-report`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        alert('Report sent successfully!');
      } else {
        alert(data.error || 'Failed to send report');
      }
    } catch (error) {
      console.error('Failed to send report:', error);
      alert('Failed to send report');
    }
    setIsSendingEmail(false);
  };

  const fetchInsights = async () => {
    setInsightsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/body-tracker/insights`);
      const data = await res.json();
      setInsights(data.insights);
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    }
    setInsightsLoading(false);
  };

  // Get HR zone config
  const hrZone = latest?.heart_rate_zone || 'rest';
  const zoneConfig = HR_ZONE_CONFIG[hrZone];

  // Get quality indicator color
  const getQualityColor = (quality: 'good' | 'warning' | 'bad') => {
    switch (quality) {
      case 'good': return 'text-emerald-500';
      case 'warning': return 'text-amber-500';
      case 'bad': return 'text-rose-500';
    }
  };

  const getQualityBg = (quality: 'good' | 'warning' | 'bad') => {
    switch (quality) {
      case 'good': return 'bg-emerald-50';
      case 'warning': return 'bg-amber-50';
      case 'bad': return 'bg-rose-50';
    }
  };

  const getQualityIcon = (quality: 'good' | 'warning' | 'bad') => {
    switch (quality) {
      case 'good': return <CheckCircle className="h-3 w-3" />;
      case 'warning': return <AlertCircle className="h-3 w-3" />;
      case 'bad': return <AlertCircle className="h-3 w-3" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-slate-50 to-pink-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 rounded-xl">
                <Heart className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Body Tracker</h1>
                <p className="text-sm text-slate-500">ECG & Motion Analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
              {latest && (
                <Badge variant="outline" className="gap-1">
                  <Battery className="h-3 w-3" />
                  {latest.battery_percent}%
                </Badge>
              )}
              {latest && (
                <Badge variant="outline" className="gap-1">
                  <Timer className="h-3 w-3" />
                  {formatDuration(latest.session_duration_sec)}
                </Badge>
              )}
              <Badge
                variant="outline"
                className={isOnline ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-300 bg-slate-50 text-slate-500"}
              >
                {isOnline ? (
                  <>
                    <Wifi className="h-3 w-3 mr-1" />
                    Live
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 mr-1" />
                    Offline
                  </>
                )}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Stats & Charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section 1: Real-time Vitals */}
            <div className="grid grid-cols-3 gap-4">
              {/* Heart Rate - Large Card */}
              <Card className="col-span-1">
                <CardContent className="flex flex-col items-center justify-center py-6">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-2"
                    style={{ backgroundColor: `${zoneConfig.color}20` }}
                  >
                    <Heart
                      className="h-8 w-8 animate-pulse"
                      style={{ color: zoneConfig.color }}
                    />
                  </div>
                  <div className="text-4xl font-bold" style={{ color: zoneConfig.color }}>
                    {latest?.heart_rate_bpm || '--'}
                  </div>
                  <div className="text-sm text-slate-500">BPM</div>
                  <Badge
                    className="mt-2"
                    style={{ backgroundColor: `${zoneConfig.color}20`, color: zoneConfig.color }}
                  >
                    {zoneConfig.label} ({zoneConfig.range})
                  </Badge>
                </CardContent>
              </Card>

              {/* Cadence */}
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-6">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                    <Footprints className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="text-3xl font-bold text-slate-900">
                    {latest?.cadence_spm || '--'}
                  </div>
                  <div className="text-sm text-slate-500">SPM</div>
                  {latest && (
                    <span className={`text-xs mt-1 flex items-center gap-1 ${getQualityColor(evaluateCadence(latest.cadence_spm))}`}>
                      {getQualityIcon(evaluateCadence(latest.cadence_spm))}
                      {latest.cadence_spm >= 170 ? 'Optimal' : latest.cadence_spm >= 160 ? 'Good' : 'Low'}
                    </span>
                  )}
                </CardContent>
              </Card>

              {/* HRV */}
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-6">
                  <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mb-2">
                    <Activity className="h-6 w-6 text-purple-500" />
                  </div>
                  <div className="text-3xl font-bold text-slate-900">
                    {latest?.hrv_rmssd_ms?.toFixed(0) || '--'}
                  </div>
                  <div className="text-sm text-slate-500">HRV (ms)</div>
                  {latest && (
                    <span className={`text-xs mt-1 ${
                      evaluateHRV(latest.hrv_rmssd_ms).status === 'excellent' ? 'text-emerald-500' :
                      evaluateHRV(latest.hrv_rmssd_ms).status === 'good' ? 'text-blue-500' :
                      evaluateHRV(latest.hrv_rmssd_ms).status === 'moderate' ? 'text-amber-500' :
                      'text-rose-500'
                    }`}>
                      {evaluateHRV(latest.hrv_rmssd_ms).label}
                    </span>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Section 2: Form & Physics */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-slate-500" />
                  Running Form Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Torso Lean */}
                  <div className={`p-3 rounded-lg ${latest ? getQualityBg(evaluateTorsoLean(latest.torso_lean_deg)) : 'bg-slate-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <ArrowUpDown className="h-4 w-4 text-slate-500" />
                      <span className="text-xs text-slate-500">Lean</span>
                    </div>
                    <div className="text-xl font-bold text-slate-900">
                      {latest?.torso_lean_deg?.toFixed(1) || '--'}°
                    </div>
                    <div className="text-xs text-slate-400">Ideal: 2-10°</div>
                    {latest && (
                      <span className={`text-xs flex items-center gap-1 mt-1 ${getQualityColor(evaluateTorsoLean(latest.torso_lean_deg))}`}>
                        {getQualityIcon(evaluateTorsoLean(latest.torso_lean_deg))}
                      </span>
                    )}
                  </div>

                  {/* Vertical Oscillation */}
                  <div className={`p-3 rounded-lg ${latest ? getQualityBg(evaluateVerticalOscillation(latest.vertical_oscillation_cm)) : 'bg-slate-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <ArrowUpDown className="h-4 w-4 text-slate-500 rotate-90" />
                      <span className="text-xs text-slate-500">Bounce</span>
                    </div>
                    <div className="text-xl font-bold text-slate-900">
                      {latest?.vertical_oscillation_cm?.toFixed(1) || '--'}cm
                    </div>
                    <div className="text-xs text-slate-400">Goal: &lt;8cm</div>
                    {latest && (
                      <span className={`text-xs flex items-center gap-1 mt-1 ${getQualityColor(evaluateVerticalOscillation(latest.vertical_oscillation_cm))}`}>
                        {getQualityIcon(evaluateVerticalOscillation(latest.vertical_oscillation_cm))}
                      </span>
                    )}
                  </div>

                  {/* Impact G-Force */}
                  <div className={`p-3 rounded-lg ${latest ? getQualityBg(evaluateImpactGForce(latest.impact_g_force)) : 'bg-slate-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="h-4 w-4 text-slate-500" />
                      <span className="text-xs text-slate-500">Impact</span>
                    </div>
                    <div className="text-xl font-bold text-slate-900">
                      {latest?.impact_g_force?.toFixed(2) || '--'}G
                    </div>
                    <div className="text-xs text-slate-400">Target: &lt;2G</div>
                    {latest && (
                      <span className={`text-xs flex items-center gap-1 mt-1 ${getQualityColor(evaluateImpactGForce(latest.impact_g_force))}`}>
                        {getQualityIcon(evaluateImpactGForce(latest.impact_g_force))}
                      </span>
                    )}
                  </div>

                  {/* Torso Rotation */}
                  <div className={`p-3 rounded-lg ${latest ? getQualityBg(evaluateTorsoRotation(latest.torso_rotation_deg)) : 'bg-slate-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <RotateCcw className="h-4 w-4 text-slate-500" />
                      <span className="text-xs text-slate-500">Twist</span>
                    </div>
                    <div className="text-xl font-bold text-slate-900">
                      {latest?.torso_rotation_deg?.toFixed(1) || '--'}°
                    </div>
                    <div className="text-xs text-slate-400">Target: &lt;15°</div>
                    {latest && (
                      <span className={`text-xs flex items-center gap-1 mt-1 ${getQualityColor(evaluateTorsoRotation(latest.torso_rotation_deg))}`}>
                        {getQualityIcon(evaluateTorsoRotation(latest.torso_rotation_deg))}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 3: Advanced Health */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Heart className="h-4 w-4 text-rose-500" />
                  Health Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {/* HRV Detail */}
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="h-4 w-4 text-purple-500" />
                      <span className="text-xs text-purple-700">HRV (rMSSD)</span>
                    </div>
                    <div className="text-xl font-bold text-purple-900">
                      {latest?.hrv_rmssd_ms?.toFixed(1) || '--'}ms
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      Avg: {avgHRV.toFixed(1)}ms
                    </div>
                  </div>

                  {/* Rhythm */}
                  <div className={`p-3 rounded-lg ${latest?.arrhythmia_flag === 'normal' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {latest?.arrhythmia_flag === 'normal' ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                      )}
                      <span className={`text-xs ${latest?.arrhythmia_flag === 'normal' ? 'text-emerald-700' : 'text-amber-700'}`}>
                        Heart Rhythm
                      </span>
                    </div>
                    <div className={`text-xl font-bold ${latest?.arrhythmia_flag === 'normal' ? 'text-emerald-900' : 'text-amber-900'}`}>
                      {latest?.arrhythmia_flag === 'normal' ? 'Normal' : 'Check'}
                    </div>
                    <div className={`text-xs mt-1 ${latest?.arrhythmia_flag === 'normal' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {latest?.arrhythmia_flag === 'normal' ? 'Rhythm OK' : 'Irregular detected'}
                    </div>
                  </div>

                  {/* Respiration */}
                  <div className="p-3 bg-sky-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Wind className="h-4 w-4 text-sky-500" />
                      <span className="text-xs text-sky-700">Respiration</span>
                    </div>
                    <div className="text-xl font-bold text-sky-900">
                      {latest?.respiration_rate || '--'}
                    </div>
                    <div className="text-xs text-sky-600 mt-1">breaths/min</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 4: Raw Charts */}
            <div className="space-y-4">
              <EcgChart
                waveformData={latest?.ecg_waveform || []}
                heartRate={latest?.heart_rate_bpm || 0}
                isOnline={isOnline}
              />

              <AccelChart
                accelX={latest?.accel_x || 0}
                accelY={latest?.accel_y || 0}
                accelZ={latest?.accel_z || 0}
                isOnline={isOnline}
              />
            </div>

            {/* Session Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Timer className="h-4 w-4 text-slate-500" />
                  Session Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <Footprints className="h-5 w-5 mx-auto mb-1 text-slate-400" />
                    <div className="text-xl font-bold text-slate-900">
                      {latest?.total_steps?.toLocaleString() || '0'}
                    </div>
                    <div className="text-xs text-slate-500">Steps</div>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <Flame className="h-5 w-5 mx-auto mb-1 text-orange-400" />
                    <div className="text-xl font-bold text-slate-900">
                      {latest?.calories_burned || '0'}
                    </div>
                    <div className="text-xs text-slate-500">Calories</div>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <Heart className="h-5 w-5 mx-auto mb-1 text-rose-400" />
                    <div className="text-xl font-bold text-slate-900">
                      {avgHeartRate.toFixed(0)}
                    </div>
                    <div className="text-xs text-slate-500">Avg HR</div>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <TrendingUp className="h-5 w-5 mx-auto mb-1 text-rose-500" />
                    <div className="text-xl font-bold text-slate-900">
                      {maxHeartRate}
                    </div>
                    <div className="text-xs text-slate-500">Max HR</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mode Switching & Controls */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4 text-slate-500" />
                  Tracking Mode
                </CardTitle>
                <CardDescription>Switch between activity modes for accurate tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button
                    variant={currentMode === 'exercise' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => changeMode('exercise')}
                    disabled={isChangingMode}
                    className={currentMode === 'exercise' ? 'bg-rose-500 hover:bg-rose-600' : ''}
                  >
                    <Dumbbell className="h-4 w-4 mr-1" />
                    Exercise
                  </Button>
                  <Button
                    variant={currentMode === 'rest' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => changeMode('rest')}
                    disabled={isChangingMode}
                    className={currentMode === 'rest' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                  >
                    <Sofa className="h-4 w-4 mr-1" />
                    Rest
                  </Button>
                  <Button
                    variant={currentMode === 'sleep' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => changeMode('sleep')}
                    disabled={isChangingMode}
                    className={currentMode === 'sleep' ? 'bg-indigo-500 hover:bg-indigo-600' : ''}
                  >
                    <Moon className="h-4 w-4 mr-1" />
                    Sleep
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  {currentMode === 'exercise' && 'Optimized for workouts. Tracks cadence, form, and exercise zones.'}
                  {currentMode === 'rest' && 'Tracks resting heart rate and HRV while idle or seated.'}
                  {currentMode === 'sleep' && 'Monitors sleep quality with low HR and high HRV tracking.'}
                </p>
              </CardContent>
            </Card>

            {/* Insights & Email */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Insights & Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* AI Insights */}
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchInsights}
                    disabled={insightsLoading}
                    className="w-full mb-2"
                  >
                    {insightsLoading ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-1" />
                    )}
                    Get AI Insights
                  </Button>
                  {insights && (
                    <div className="p-3 bg-amber-50 rounded-lg text-sm text-amber-900 whitespace-pre-wrap">
                      {insights}
                    </div>
                  )}
                </div>

                {/* Email Configuration */}
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-slate-500" />
                    <span className="text-sm font-medium">Email Reports</span>
                    {emailConfigured && (
                      <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                        Configured
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-1" />
                          {emailConfigured ? 'Update' : 'Setup'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Configure Email Reports</DialogTitle>
                          <DialogDescription>
                            Enter your Gmail address and App Password to receive health reports.
                            <a
                              href="https://myaccount.google.com/apppasswords"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline ml-1"
                            >
                              Get App Password
                            </a>
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <label className="text-sm font-medium">Gmail Address</label>
                            <Input
                              type="email"
                              placeholder="your.email@gmail.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">App Password</label>
                            <Input
                              type="password"
                              placeholder="xxxx xxxx xxxx xxxx"
                              value={appPassword}
                              onChange={(e) => setAppPassword(e.target.value)}
                            />
                            <p className="text-xs text-slate-500 mt-1">
                              Use a Google App Password, not your regular password
                            </p>
                          </div>
                          <Button
                            onClick={configureEmail}
                            disabled={isConfiguringEmail || !email || !appPassword}
                            className="w-full"
                          >
                            {isConfiguringEmail ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Mail className="h-4 w-4 mr-1" />
                            )}
                            Save Configuration
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {emailConfigured && (
                      <Button
                        size="sm"
                        onClick={sendReport}
                        disabled={isSendingEmail}
                        className="bg-rose-500 hover:bg-rose-600"
                      >
                        {isSendingEmail ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 mr-1" />
                        )}
                        Send Report
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Chat */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 h-[calc(100vh-120px)]">
              <BodyTrackerChat latest={latest} history={history} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
