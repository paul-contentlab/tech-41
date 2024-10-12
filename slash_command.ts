import { REST, Routes, ApplicationCommandOptionType } from "discord.js";
import { DiscordIds } from "../enums/enums";

const CL_BOT_CLIENT_ID = DiscordIds.contentLabClient;
const TEST_BOT_CLIENT_ID = DiscordIds.testClient;
const serverToken = process.env.TOKEN;

interface Command {
  name: string;
  description: string;
  options?: CommandOption[];
}

interface CommandOption {
  name: string;
  type: ApplicationCommandOptionType;
  description: string;
  required: boolean;
  choices?: { name: string; value: string }[];
}

async function registerSlashCommand(): Promise<void> {
  const commands: Command[] = [
    {
      name: "views",
      description: "calculate the average views for TikTok Creators",
      options: [
        {
          name: "url",
          type: 3, // STRING type
          description: "Creator TikTok URl",
          required: true,
        },
      ],
    },
    {
      name: "report",
      description: "Setup a daily campaign reporting",
      options: [
        {
          name: "intrack-url",
          type: 3, // STRING type
          description: "The link to the Google Sheet InTrack",
          required: true,
        },
        {
          name: "report-time",
          type: 3, // STRING type
          description: "The time when you want the report to be triggered",
          required: true,
        },
        {
          name: "report-timezone",
          type: 3, // STRING type
          description:
            "The timezone in which you want the report-time to be saved",
          required: true,
        },
        {
          name: "hot-leads-update",
          type: 5, // BOOLEAN type
          description:
            "If set to true, adds a section about new hot leads to the report",
          required: true,
        },
        {
          name: "address-update",
          type: 5, // BOOLEAN type
          description:
            "If set to true, adds a section about new shipping addresses to the report",
          required: true,
        },
      ],
    },
    {
      name: "stop_report",
      description: "Stop the daily campaign reporting",
    },
    {
      name: "create-campaign",
      description: "create a new campaign",
    },
    {
      name: "request-sourcing-round",
      description: "Displays link to the sourcing round request form.",
    },
    {
      name: "request-social-listening",
      description: "Displays link to the sourcing round request form.",
    },
    {
      name: "request-creative",
      description: "Request a creative",
      options: [
        {
          name: "creative_type",
          type: 3, // STRING type
          description: "Select the creative type",
          required: true,
          choices: [
            { name: "Creative Direction", value: "creative direction" },
            { name: "Creative Brief", value: "creative brief" },
            { name: "Concept Form", value: "concept form" },
          ],
        },
        {
          name: "creative_lead",
          type: 3, // USER type
          description: "Select the creative lead",
          required: true,
          choices: [
            { name: "Ash Wang", value: "1258103598756401175" },
            { name: "Christine Ebrada", value: "633283839292211201" },
            { name: "Leana Braga", value: "764498717658972170" },
            { name: "Lesi Xie", value: "1157112680042201149" },
          ],
        },
        {
          name: "due_date",
          type: 3, // STRING type
          description: "Set the due date in the following format: yyyy-mm-dd",
          required: true,
        },
      ],
    },
    {
      name: "assign-poc",
      description: "Assign points of contact for the campaign",
      options: [
        {
          name: "client-lead",
          type: 6, // USER type
          description: "Select the client lead",
          required: false,
        },
        {
          name: "client-support",
          type: 6, // USER type
          description: "Select the client support",
          required: false,
        },
        {
          name: "campaign-lead",
          type: 6, // USER type
          description: "Select the campaign lead",
          required: false,
        },
        {
          name: "campaign-support",
          type: 6, // USER type
          description: "Select the campaign support",
          required: false,
        },
        {
          name: "creative-lead",
          type: 6, // USER type
          description: "Select the creative lead",
          required: false,
        },
        {
          name: "sourcing-lead",
          type: 6, // USER type
          description: "Select the sourcing lead",
          required: false,
        },
        {
          name: "sourcing-support",
          type: 6, // USER type
          description: "Select the sourcing support",
          required: false,
        },
      ],
    },
    {
      name: "wrap-campaign",
      description: "Start the wrap campaign interaction",
    },
  ];

  const rest = new REST({ version: "9" }).setToken(serverToken ?? "");
  try {
    await rest.put(
      Routes.applicationGuildCommands(TEST_BOT_CLIENT_ID, "996069558014197930"),
      { body: commands },
    );
    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
}

(async () => {
  await registerSlashCommand();
})();

export { registerSlashCommand };
