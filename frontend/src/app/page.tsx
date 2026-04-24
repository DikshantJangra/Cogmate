import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { HiPlus, HiArrowDownTray, HiOutlineCpuChip, HiOutlineDocumentText, HiOutlineAcademicCap } from "react-icons/hi2";
import { RiRobot2Line, RiUserVoiceLine, RiFocus2Line } from "react-icons/ri";

export default function Home() {
  return (
    <main className="container mx-auto py-12 px-6 min-h-screen selection:bg-primary/10">
      <div className="flex flex-col gap-10">
        <header className="flex flex-col gap-3 relative overflow-hidden p-8 rounded-3xl bg-linear-to-br from-primary/5 via-transparent to-primary/5 border border-primary/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full -mr-20 -mt-20" />
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-lg">
              <HiOutlineAcademicCap className="size-8" />
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/70">
                Cogmate
              </h1>
              <Badge variant="secondary" className="rounded-full px-3 py-0.5 text-xs font-semibold uppercase tracking-wider">
                Alpha v0.1.0
              </Badge>
            </div>
          </div>
          <p className="text-muted-foreground text-xl max-w-2xl leading-relaxed">
            The Algorithmic Instructional Designer. <span className="text-foreground font-medium">Real-time classroom companion</span> and post-class synthesis engine.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 shadow-xl shadow-foreground/5 border-primary/5 overflow-hidden group">
            <CardHeader className="border-b border-primary/5 bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <RiUserVoiceLine className="text-primary" /> Live Session Feed
                  </CardTitle>
                  <CardDescription className="text-base">Real-time transcript and visual capture from the classroom.</CardDescription>
                </div>
                <Badge variant="outline" className="animate-pulse flex gap-1.5 items-center text-red-500 border-red-200 bg-red-50">
                  <div className="size-2 rounded-full bg-red-500" /> LIVE
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px] w-full p-6">
                <div className="space-y-6">
                  <div className="flex flex-col gap-2 p-4 rounded-2xl bg-muted/30 border border-transparent hover:border-primary/10 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                        <RiUserVoiceLine /> 10:05 AM — Professor
                      </span>
                    </div>
                    <p className="text-base leading-relaxed">Welcome class! Today we are going to dive deep into multi-agent systems and how they can collaborate to solve complex tasks.</p>
                  </div>
                  <div className="flex flex-col gap-2 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
                        <RiFocus2Line /> 10:07 AM — Highlighter
                      </span>
                      <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors">Definition</Badge>
                    </div>
                    <p className="text-base italic font-medium leading-relaxed">
                      &quot;Multi-agent systems (MAS) are systems composed of multiple interacting intelligent agents.&quot;
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 p-4 rounded-2xl bg-muted/30 border border-transparent hover:border-primary/10 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                        <RiUserVoiceLine /> 10:12 AM — Professor
                      </span>
                    </div>
                    <p className="text-base leading-relaxed">Think of them as a team of specialized specialists, each with their own goals but working towards a collective objective.</p>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-8">
            <Card className="shadow-xl shadow-foreground/5 border-primary/5 hover:border-primary/20 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HiOutlineCpuChip className="text-primary" /> Session Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-muted/50 border border-primary/5">
                    <span className="text-sm font-semibold text-muted-foreground">Duration</span>
                    <span className="text-sm font-mono font-bold bg-background px-2 py-1 rounded-lg border border-primary/5 shadow-xs">45m 12s</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-muted/50 border border-primary/5">
                    <span className="text-sm font-semibold text-muted-foreground">Concepts Identified</span>
                    <span className="text-sm font-mono font-bold bg-background px-2 py-1 rounded-lg border border-primary/5 shadow-xs">12</span>
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-xl bg-linear-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                    <span className="text-sm font-semibold text-green-700">Importance Score</span>
                    <span className="text-2xl font-black text-green-600 tracking-tight">8.4<span className="text-sm font-normal text-green-700/50">/10</span></span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl shadow-foreground/5 border-primary/5 overflow-hidden">
              <CardHeader className="bg-primary text-primary-foreground">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 p-6 bg-muted/20">
                <Button size="lg" className="w-full shadow-lg hover:shadow-primary/20 transition-all">
                  <HiPlus className="size-5" /> Start New Session
                </Button>
                <Button variant="outline" size="lg" className="w-full bg-background/50 backdrop-blur-sm shadow-xs border-primary/10 hover:border-primary/30">
                  <HiArrowDownTray className="size-5" /> Export Lesson Pack
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="architect" className="w-full space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-16 p-2 rounded-2xl bg-muted/50 border border-primary/5 gap-2">
            <TabsTrigger value="architect" className="rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg flex gap-2 transition-all">
              <HiOutlineCpuChip className="size-5" /> Architect Agent
            </TabsTrigger>
            <TabsTrigger value="content" className="rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg flex gap-2 transition-all">
              <HiOutlineDocumentText className="size-5" /> Content Agent
            </TabsTrigger>
            <TabsTrigger value="student" className="rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg flex gap-2 transition-all">
              <RiRobot2Line className="size-5" /> Simulated Student
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="architect" className="focus-visible:outline-none transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
            <Card className="border-primary/5 shadow-2xl shadow-primary/5 overflow-hidden">
              <CardHeader className="border-b border-primary/5 bg-linear-to-r from-primary/5 to-transparent">
                <CardTitle className="text-2xl">Lesson Architecture</CardTitle>
                <CardDescription className="text-base">Mapping the lecture to Gagné&apos;s Nine Events of Instruction.</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="flex flex-col items-center justify-center py-12 text-center gap-6">
                  <div className="p-6 rounded-full bg-primary/5 animate-pulse">
                    <HiOutlineCpuChip className="size-16 text-primary/30" />
                  </div>
                  <div className="space-y-2 max-w-md">
                    <h3 className="text-xl font-bold">Blueprint in Progress</h3>
                    <p className="text-muted-foreground">The Architect Agent is currently analyzing the session store to build the instructional blueprint. This usually takes 30-60 seconds.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="focus-visible:outline-none transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
            <Card className="border-primary/5 shadow-2xl shadow-primary/5 overflow-hidden">
              <CardHeader className="border-b border-primary/5 bg-linear-to-r from-primary/5 to-transparent">
                <CardTitle className="text-2xl">Learning Materials</CardTitle>
                <CardDescription className="text-base">Generated notes, flashcards, and assessment questions.</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="flex flex-col items-center justify-center py-12 text-center gap-6">
                  <div className="p-6 rounded-full bg-primary/5">
                    <HiOutlineDocumentText className="size-16 text-primary/30" />
                  </div>
                  <div className="space-y-2 max-w-md">
                    <h3 className="text-xl font-bold">Waiting for Blueprint</h3>
                    <p className="text-muted-foreground">Learning materials will appear here once the Architect Agent completes the instructional blueprint for this session.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="student" className="focus-visible:outline-none transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
            <Card className="border-primary/5 shadow-2xl shadow-primary/5 overflow-hidden">
              <CardHeader className="border-b border-primary/5 bg-linear-to-r from-primary/5 to-transparent">
                <CardTitle className="text-2xl">Simulation Failure Log</CardTitle>
                <CardDescription className="text-base">Identifying gaps in the content via an adversarial agent loop.</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="flex flex-col items-center justify-center py-12 text-center gap-6">
                  <div className="p-6 rounded-full bg-red-500/5">
                    <RiRobot2Line className="size-16 text-red-500/20" />
                  </div>
                  <div className="space-y-2 max-w-md">
                    <h3 className="text-xl font-bold">Awaiting Validation</h3>
                    <p className="text-muted-foreground">The Simulated Student hasn&apos;t started the validation loop yet. It will begin once the first draft of content is generated.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
