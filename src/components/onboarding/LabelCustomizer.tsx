"use client";

import { Box, Group, TextInput, Text, Paper, Switch, ActionIcon, Title, Tooltip, Stack, Button, ThemeIcon, Popover, SimpleGrid, UnstyledButton, ScrollArea } from "@mantine/core";
import { AlertCircle, Trash2, Plus, Info, ChevronDown } from "lucide-react";

interface TicketLabel {
  category: "ISSUE" | "CHANGE";
  label: string;
  icon: string;
}

interface LabelCustomizerProps {
  labels: TicketLabel[];
  onChange: (labels: TicketLabel[]) => void;
}

const ICON_GROUPS = [
  {
    name: "General",
    icons: ["🚨", "📋", "🔄", "📝", "✨", "✅", "⏳", "🏁", "📁", "📍", "⚠️", "🔔"]
  },
  {
    name: "Creative & Art",
    icons: ["🎨", "🖌️", "🎬", "📸", "🎵", "🎭", "🎥", "🎞️", "🖼️", "🖋️", "✒️", "🎧"]
  },
  {
    name: "Education",
    icons: ["🍎", "📚", "🎓", "✏️", "🏫", "🧠", "📓", "🔬", "🔭", "📝", "🌍", "📐"]
  },
  {
    name: "Tech & Software",
    icons: ["💻", "🐛", "🌐", "🔒", "🤖", "🔨", "🛠️", "🔌", "📡", "🔋", "⚙️", "🔧"]
  },
  {
    name: "Business",
    icons: ["💰", "📈", "🗓️", "📢", "⚖️", "🤝", "💼", "📊", "📬", "📧", "💎", "🔥"]
  }
];

export function LabelCustomizer({ labels, onChange }: LabelCustomizerProps) {
  const updateLabel = (index: number, field: keyof TicketLabel, value: any) => {
    const newLabels = [...labels];
    newLabels[index] = { ...newLabels[index], [field]: value };
    onChange(newLabels);
  };

  const addLabel = () => {
    onChange([...labels, { category: "ISSUE", label: "", icon: "📝" }]);
  };

  const removeLabel = (index: number) => {
    if (labels.length <= 1) return;
    const newLabels = labels.filter((_, i) => i !== index);
    onChange(newLabels);
  };

  const hasApprovalLabel = labels.some(l => l.category === 'CHANGE');

  return (
    <Box className="space-y-6 pt-4">
      <div className="text-center mb-8">
        <Title order={3} className="text-xl font-bold text-[#0d0d0d] tracking-tight">Configure Your Ticket Labels</Title>
        <Text size="xs" className="text-[#888] font-medium mt-1">Add, edit, or remove the categories of work you want to track.</Text>
      </div>

      <div className="space-y-4 max-h-[440px] overflow-y-auto pr-2 custom-scrollbar">
        {labels.map((item, index) => (
          <Paper 
            key={index} 
            withBorder 
            radius="2rem" 
            p="md" 
            className="bg-white border-[#f0f0f0] hover:border-slate-300 transition-all shadow-sm group"
          >
            <Stack gap="md">
              <Group justify="apart" wrap="nowrap">
                <Group gap="xs" className="flex-1">
                  {/* Icon Picker Popover */}
                  <Popover position="bottom" withArrow shadow="md" radius="lg" offset={10}>
                    <Popover.Target>
                      <UnstyledButton 
                        className="w-14 h-[3rem] bg-[#f8f9fa] rounded-[1rem] flex items-center justify-center text-2xl border border-[#eee] hover:border-[#ddd] transition-all"
                      >
                         {item.icon}
                         <Box className="absolute bottom-1 right-1 bg-white rounded-full p-0.5 shadow-sm border border-[#eee] rotate-12">
                            <ChevronDown size={8} className="text-[#888]" />
                         </Box>
                      </UnstyledButton>
                    </Popover.Target>
                    <Popover.Dropdown p="xs" className="w-[280px]">
                       <ScrollArea h={250} type="hover" offsetScrollbars>
                          <Stack gap="sm">
                             {ICON_GROUPS.map(group => (
                                <Box key={group.name} className="space-y-1.5">
                                   <Text fw={800} color="dimmed" className="uppercase tracking-widest px-1" style={{ fontSize: '10px' }}>{group.name}</Text>
                                   <SimpleGrid cols={6} spacing={4}>
                                      {group.icons.map(icon => (
                                         <UnstyledButton 
                                            key={icon} 
                                            onClick={() => updateLabel(index, 'icon', icon)}
                                            className={`flex items-center justify-center p-1.5 text-xl rounded-lg transition-colors ${item.icon === icon ? 'bg-[#0d0d0d10] border-2 border-[#0d0d0d10]' : 'hover:bg-[#f8f9fa]'}`}
                                         >
                                            {icon}
                                         </UnstyledButton>
                                      ))}
                                   </SimpleGrid>
                                </Box>
                             ))}
                          </Stack>
                       </ScrollArea>
                    </Popover.Dropdown>
                  </Popover>

                  <TextInput
                    placeholder="Label Title (e.g. Bug Report, Client Query...)"
                    value={item.label}
                    onChange={(e) => updateLabel(index, 'label', e.target.value)}
                    className="flex-1"
                    styles={{ input: { borderRadius: '1rem', fontWeight: 700, height: '3rem', border: '2px solid #f8f9fa', '&:focus': { border: '2px solid #0d0d0d' } } }}
                  />
                </Group>
                
                <Tooltip label="Remove this label" position="left" withArrow>
                  <ActionIcon 
                    variant="subtle" 
                    color="red" 
                    radius="md" 
                    size="lg" 
                    onClick={() => removeLabel(index)}
                    disabled={labels.length <= 1}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={18} />
                  </ActionIcon>
                </Tooltip>
              </Group>

              <Group justify="apart" className="px-1">
                <Group gap="xs">
                  <Switch
                    label={
                      <Text size="xs" fw={700} className="text-[#555]">Requires Client Approval</Text>
                    }
                    checked={item.category === 'CHANGE'}
                    onChange={(e) => updateLabel(index, 'category', e.currentTarget.checked ? 'CHANGE' : 'ISSUE')}
                    color="dark"
                    size="xs"
                  />
                  <Tooltip label="Tickets with this label will require an approver before implementation." withArrow>
                    <Info size={12} className="text-[#bbb]" />
                  </Tooltip>
                </Group>
              </Group>
            </Stack>
          </Paper>
        ))}
      </div>

      <Box className="flex flex-col gap-4 pt-2">
        <Button 
          variant="light" 
          color="gray" 
          radius="xl" 
          leftSection={<Plus size={16} />}
          onClick={addLabel}
          fullWidth
          className="h-14 border border-dashed border-[#ddd] bg-[#fafafa] hover:bg-slate-50 transition-colors"
          styles={{ label: { fontSize: '0.85rem', fontWeight: 700 } }}
        >
          Add Another Custom Label
        </Button>

        {hasApprovalLabel && (
          <Box className="p-4 bg-amber-50 rounded-[1.5rem] border border-amber-100 flex gap-4 items-start animate-in fade-in slide-in-from-top-2 duration-300">
            <ThemeIcon size="md" color="amber" variant="light" className="mt-0.5 rounded-lg shadow-sm">
              <AlertCircle size={14} />
            </ThemeIcon>
            <Text size="xs" className="text-amber-800 leading-relaxed font-semibold">
               <strong>Important:</strong> Only use the 'Requires Approval' switch if you need a client to approve the work before it can be resolved.
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}
