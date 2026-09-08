1. Installed prisma 6.19.0 since 7 doesnt support mongodb
- i've chosen nosql than sql since messages may have text, image, or document

2. I've decided to add both mongodb+prisma and authclerk for account due to more information e.g. userid for conversationid
- remove authorization header since authclerk handles the signup, login, and deactivation account security

3. Scroll-area doesnt show scroll-bar
- inside the scroll-area is div with max-h-[#### px]

4. Ollama CMD CLI seems to be inconsistent with either not detect image or hallucinating by overexplaining whats not there for gemma4:e4b
- explanation:
The pattern across multiple GitHub issues matches yours almost exactly: gemma4:e4b (and its smaller sibling e2b) intermittently claims an image is missing, corrupted, or "a dark void," or hallucinates unrelated content — while the same exact image and prompt works fine on gemma4:12b or larger. One issue thread is titled "Gemma4:e4b failed to work with the image uploaded," where the reporter found the same failure across three different frontends and confirmed the identical prompt and image works fine with gemma4:12b or gemma4:31b-cloud. Another open issue reports the same regression: gemma4:e2b and gemma4:e4b have stopped working reliably with images, sometimes saying the image isn't visible and sometimes producing gibberish, while gemma4:12b handles the same inputs fine. A separate report is literally titled "Gemma4 doesn't support images in ollama v0.20.0."
- solution: use other compatible model like gemma4:12b

5. Ollama doesnt seem to have a document reader (like plain binary file)
- make script that extracts text, image, and formatting as a fallback if a model or tool cant read document
- will change it to langchain/langgraph document reader if doable