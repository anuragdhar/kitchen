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
  if (room === 'drawing') {
    // The current layout (C by default) with its built-ins, furniture and the west cabinet; the door-swing ghost and the
    // layout labels are planning overlays, not things to render.
    const swing = page.getByRole('button', {name: 'Hide entry door swing', exact: true})
    if (await swing.isVisible()) await swing.click()
    const labels = page.getByRole('button', {name: 'Hide TV wall labels', exact: true})
    if (await labels.isVisible()) await labels.click()
    const showFurniture = page.getByRole('button', {name: 'Show furniture', exact: true})
    if (await showFurniture.isVisible()) await showFurniture.click()
    // Render from inside, looking at the TV wall, not the cutaway overview.
    await page.getByRole('button', {name: 'TV wall view', exact: true}).click()
  }
  // Let React's visibility/camera effects and the renderer reach the same frame
  // before recording either the reference image or the exported world matrices.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
