// Configure repository-default captures through the same controls as a user.
// Manual exports still preserve the user's explicitly chosen visibility.
export async function prepareRoomExport(page, room) {
  if (room === 'bedroom3') {
    // The normal overview is a cutaway with this entire group hidden. It holds
    // the balcony door/window as well as the wall, so exporting it loses both.
    await page.getByRole('button', {name: 'Balcony door + window', exact: true}).click();
    await page.getByRole('button', {name: 'Hide south wall', exact: true}).waitFor({state: 'visible'});
    const showFurniture = page.getByRole('button', {name: 'Show furniture', exact: true});
    if (await showFurniture.isVisible()) await showFurniture.click();
  }
  // Let React's visibility/camera effects and the renderer reach the same frame
  // before recording either the reference image or the exported world matrices.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
