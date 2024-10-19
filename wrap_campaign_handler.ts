import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  InteractionReplyOptions,
  ButtonInteraction,
  ModalSubmitInteraction,
  InteractionType,
} from "discord.js";

import {
  getCampaignModel,
  testContentDb,
  googleSheetsPromise,
} from "cl-shared-library/index";
import { NamedRangeDetails } from "./types";

const Campaign = getCampaignModel(testContentDb);

async function wrapCampaign(interaction: ButtonInteraction): Promise<void> {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("wrap_invoice_no")
      .setLabel("No, not yet")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("wrap_invoice_yes")
      .setLabel("Yes, already sent")
      .setStyle(ButtonStyle.Success),
  );

  await interaction.reply({
    content: "Has the final invoice been sent out to the client?",
    components: [row],
  });
}

async function handleWrapCampaignInteraction(
  interaction: ButtonInteraction | ModalSubmitInteraction,
): Promise<void> {
  if (interaction.isButton() && interaction.customId.startsWith("wrap_")) {
    switch (interaction.customId) {
      case "wrap_invoice_no":
        await handleInvoiceNo(interaction);
        break;
      case "wrap_invoice_yes":
        await handleInvoiceYes(interaction);
        break;
      case "wrap_kpi_not_accurate":
        await handleKpiNotAccurate(interaction);
        break;
      case "wrap_kpi_accurate":
        await handleKpiAccurate(interaction);
        break;
      case "wrap_no_bonus_kpi":
        await handleNoBonusKpi(interaction);
        break;
      case "wrap_yes_bonus_kpi":
        await showBonusReasonModal(interaction);
        break;
    }
  } else if (
    interaction.type === InteractionType.ModalSubmit &&
    interaction.customId === "bonusReasonModal"
  ) {
    await handleBonusReasonModalSubmit(interaction);
  }
}

async function handleInvoiceNo(interaction: ButtonInteraction): Promise<void> {
  await interaction.update({
    content:
      "👀 Hupsie. You said the final invoice hasn't been sent to the client yet, so I stopped working on wrapping up the campaign. Please send out the final invoice first and then run the command again.",
    components: [],
  });
}

async function handleInvoiceYes(interaction: ButtonInteraction): Promise<void> {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("wrap_kpi_not_accurate")
      .setLabel("Not accurate, stop")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("wrap_kpi_accurate")
      .setLabel("Accurate, continue")
      .setStyle(ButtonStyle.Success),
  );

  await interaction.update({
    content:
      "The InTrack reflects the following KPI and client survey status:\n- KPI: {KPI Status from 'when to execute}\n- Client Survey: {Status from 'when to execute}\nIs this accurate?",
    components: [row],
  });
}

// ... (other functions)

async function handleKpiNotAccurate(
  interaction: ButtonInteraction,
): Promise<void> {
  await interaction.update({
    content:
      "👀 Hupsie. You said the KPI aren't correct, so I stopped working on wrapping up the campaign. Please correct the KPI on the InTrack and then run the command again.",
    components: [],
  });
}

async function handleKpiAccurate(
  interaction: ButtonInteraction,
): Promise<void> {
  // const campaignChannelId = interaction.channelId;
  const campaignChannelId = "1256905250523189329"; // TODO: Replace with actual channel ID

  const campaignDoc = await Campaign.findOne({
    discord_channel_id: campaignChannelId,
  });
  if (!campaignDoc) {
    throw new CustomError("Campaign not found for the given channel ID.", 404);
  }

  const intrackSpreadsheetId = campaignDoc.campaign_links.intrack;
  const isUnlocked = await isBonusUnlocked(
    intrackSpreadsheetId,
    "bonusVariable",
  );

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("wrap_no_bonus_kpi")
      .setLabel("NO")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("wrap_yes_bonus_kpi")
      .setLabel("YES")
      .setStyle(ButtonStyle.Secondary),
  );

  if (!isUnlocked) {
    await interaction.update({
      content:
        "Do you want to unlock the bonus variable for commission? This will lead to an additional 10% commission payment for the team.",
      components: [row],
    });
  } else {
    await interaction.reply({
      content: `Thank you <@${interaction.user.id}>. The campaign wrap up has been initialized and you'll get notified once it is completed. 🙌`,
    });
    // TODO: write to the wrap queue
  }
}

async function handleNoBonusKpi(interaction: ButtonInteraction): Promise<void> {
  await interaction.reply({
    content: `Thank you <@${interaction.user.id}>. The campaign wrap up has been initialized and you'll get notified once it is completed. 🙌`,
  });
  // TODO: write to the wrap queue
}

async function showBonusReasonModal(
  interaction: ButtonInteraction,
): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId("bonusReasonModal")
    .setTitle("Unlock Bonus Variable");

  const reasonInput = new TextInputBuilder()
    .setCustomId("bonusReason")
    .setLabel("Explain why bonus should be unlocked.")
    .setStyle(TextInputStyle.Paragraph);

  const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    reasonInput,
  );
  modal.addComponents(actionRow);

  await interaction.showModal(modal);
}

async function handleBonusReasonModalSubmit(
  interaction: ModalSubmitInteraction,
): Promise<void> {
  const reason = interaction.fields.getTextInputValue("bonusReason");
  const userName = interaction.user.username; // Get the full name of the user who runs the command
  const currentDate = new Date().toLocaleDateString("en-US"); // Get the current date in MM/DD/YYYY format

  // Construct the note
  const note = `${currentDate} - Bonus variable unlocked by ${userName} during campaign wrapping. Reason: ${reason}`;

  await interaction.reply({
    content: `Thank you <@${interaction.user.id}>. The campaign wrap up has been initialized and you'll get notified once it is completed. 🙌`,
  });

  // const campaignChannelId = interaction.channelId;
  const campaignChannelId = "1256905250523189329"; // TODO: Replace with actual channel ID

  const campaignDoc = await Campaign.findOne({
    discord_channel_id: campaignChannelId,
  });
  if (!campaignDoc) {
    throw new CustomError("Campaign not found for the given channel ID.", 404);
  }

  const intrackSpreadsheetId = campaignDoc.campaign_links.intrack;

  // Get the range details of the 'bonusVariable' named range
  const rangeDetails = await getNamedRangeDetails(
    intrackSpreadsheetId,
    "bonusVariable",
  );

  // Set the reason as a note in the InTrack spreadsheet
  await setCellNote(intrackSpreadsheetId, rangeDetails, note);

  // TODO: write to the wrap queue
}

// Helpers
async function isBonusUnlocked(
  spreadsheetId: any,
  rangeName: string,
): Promise<boolean> {
  const googleSheets = await googleSheetsPromise;
  try {
    const response = await googleSheets.spreadsheets.values.get({
      spreadsheetId,
      range: rangeName,
    });

    const values = response.data.values || [[]];
    const bonusVariableValue = values[0][0];

    return bonusVariableValue === "🔓 Unlocked";
  } catch (error) {
    console.error(
      `Error checking named range ${rangeName} in spreadsheet ${spreadsheetId}: ${error.message}`,
    );
    return false;
  }
}

async function getNamedRangeDetails(
  spreadsheetId: any,
  namedRangeName: string,
): Promise<NamedRangeDetails> {
  const googleSheets = await googleSheetsPromise;
  try {
    const response = await googleSheets.spreadsheets.get({
      spreadsheetId,
      ranges: [namedRangeName],
      fields: "namedRanges",
    });

    const namedRanges = response.data.namedRanges;
    if (!namedRanges || namedRanges.length === 0) {
      throw new Error(`Named range '${namedRangeName}' not found.`);
    }

    const namedRange = namedRanges.find(
      (range: { name: any }) => range.name === namedRangeName,
    );
    if (!namedRange) {
      throw new Error(`Named range '${namedRangeName}' not found.`);
    }

    const range = namedRange.range;
    return {
      sheetId: range.sheetId,
      startRowIndex: range.startRowIndex,
      endRowIndex: range.endRowIndex,
      startColumnIndex: range.startColumnIndex,
      endColumnIndex: range.endColumnIndex,
    };
  } catch (error) {
    console.error(
      `Error retrieving named range '${namedRangeName}' in spreadsheet ${spreadsheetId}: ${error.message}`,
    );
    throw error;
  }
}

async function setCellNote(
  spreadsheetId: any,
  range: {
    sheetId: any;
    startRowIndex: any;
    endRowIndex: any;
    startColumnIndex: any;
    endColumnIndex: any;
  },
  note: string,
): Promise<void> {
  console.log("note:");
  console.log(note);
  const googleSheets = await googleSheetsPromise;
  try {
    const request = {
      spreadsheetId,
      resource: {
        requests: [
          {
            updateCells: {
              range: {
                sheetId: range.sheetId,
                startRowIndex: range.startRowIndex,
                endRowIndex: range.endRowIndex,
                startColumnIndex: range.startColumnIndex,
                endColumnIndex: range.endColumnIndex,
              },
              rows: [
                {
                  values: [
                    {
                      note: note,
                    },
                  ],
                },
              ],
              fields: "note",
            },
          },
        ],
      },
    };

    await googleSheets.spreadsheets.batchUpdate(request);
    console.log(
      `Note set on range ${JSON.stringify(range)} in spreadsheet ${spreadsheetId}`,
    );
  } catch (error) {
    console.error(
      `Error setting note on range ${JSON.stringify(range)} in spreadsheet ${spreadsheetId}: ${error.message}`,
    );
  }
}

export {
  wrapCampaign,
  handleWrapCampaignInteraction,
  handleInvoiceNo,
  handleInvoiceYes,
  handleKpiNotAccurate,
  handleNoBonusKpi,
  handleKpiAccurate,
  showBonusReasonModal,
  handleBonusReasonModalSubmit,
};
