const USER_MESSAGES = {
  invalid_input_url: "Listen Link didn’t receive a valid song link. Share a song directly from Apple Music or Spotify and try again.",
  unsupported_source_service: "Listen Link currently supports Apple Music and Spotify links. Share a song directly from one of those apps.",
  unsupported_target_service: "Choose Apple Music or Spotify as the recipient’s service and try again.",
  not_found_in_fake_catalog: "This song isn’t available in Listen Link yet. You can share the original link instead.",
  target_link_unavailable: "Listen Link found the song but couldn’t find a link for the recipient’s service. You can share the original link instead."
};

export function shortcutResponse(result) {
  if (result.ok) {
    return {
      outcome: "share",
      url: result.url
    };
  }

  return {
    outcome: "alert",
    message: USER_MESSAGES[result.reason] || "Listen Link couldn’t convert this song. Try sharing it again."
  };
}
