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
} from "discord.js";

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
  await interaction.reply(`Thank you for your input: ${reason}`);

  // Process the reason here
  // TODO: intrack integration

  // then, post waiting message & write to the wrap queue
}

export {
  wrapCampaign,
  handleInvoiceNo,
  handleInvoiceYes,
  handleKpiNotAccurate,
  handleKpiAccurate,
  showBonusReasonModal,
  handleBonusReasonModalSubmit,
};
