# Magpie Terms of Use

**Draft — not legal advice. Requires review before launch.**

These terms are a working draft. They describe how Magpie is intended to operate and what is expected of a user. They have not been reviewed by a lawyer and must be reviewed before the service is offered to anyone.

---

## 1. Scope of the service

1.1 Magpie is a personal tool for saving short-form content that you explicitly share with it, and for searching that content later by meaning.

1.2 Magpie processes a link only when you share it. It does not crawl accounts, feeds, or other users' content, and it does not build a public index of any platform.

1.3 Magpie is not affiliated with, endorsed by, or sponsored by Instagram, Meta, or any other platform.

1.4 You need an account to use Magpie. You are responsible for activity under your account.

---

## 2. User warranties

2.1 By submitting a link or a file, you confirm that you have the right to save that content, or that you are authorised to submit it.

2.2 You confirm that your submission does not infringe anyone's copyright, privacy, or other rights.

2.3 Public visibility is not a licence. A public post can be viewed by anyone, but viewing is not reproduction. These terms do not give you a right to save public content, and nothing in the app should be read as granting one.

2.4 If a submission turns out to be unauthorised, you are responsible for it, not Magpie.

---

## 3. Licence to process

3.1 You grant Magpie a limited licence to process the content you submit, only for the purpose of providing the service to you.

3.2 The licence covers transient processing: fetching the page, reading its metadata, and, for video posts, downloading the video to temporary storage for transcription and text extraction.

3.3 Original media is deleted by the end of each background capture attempt, whether it succeeds or fails. It is not kept in Magpie's storage, not placed on a CDN, and not given a public URL.

3.4 The licence ends when processing ends, apart from the derived data described in section 6.

---

## 4. Prohibited uses

4.1 You must not use Magpie to sell content, or to offer content for sale.

4.2 You must not use Magpie to display content publicly.

4.3 You must not use Magpie to build a mirror, archive, or substitute for Instagram or any other platform.

4.4 You must not re-upload captured content to any platform.

4.5 You must not use Magpie to bulk-collect content, to scrape accounts or feeds, or to process content you were not authorised to submit.

---

## 5. Copyright and privacy complaints / takedown

5.1 Magpie will publish a monitored takedown address before launch: `[contact address]`. The placeholder must be replaced with a monitored mailbox before the service is offered; until then, this section describes the intended process, not a live channel.

5.2 If you believe content saved through Magpie infringes your rights, write to that address with enough detail to identify the item and the right you say is infringed.

5.3 On a valid notice, Magpie deletes the item and all data derived from it. That includes the transcript, the extracted frames, the extracted fields, and the embeddings. Deleting only the media is not enough, and Magpie does not do that.

5.4 Magpie may remove an item before a notice is resolved if the claim appears credible.

5.5 Repeated or serious infringement can lead to suspension of the account.

---

## 6. Retention and deletion

6.1 Magpie keeps the caption, the author when available, the transcript, the extracted fields, and the embeddings.

6.2 Magpie does not keep the original video, the extracted audio, or the raw page HTML.

6.3 A small thumbnail and downscaled OCR frames are kept only once private media storage is enabled (Step 4). Until then, no media is persisted. Once enabled, they are stored in a private bucket readable only by the owner and are deleted with the item.

6.4 You can delete an item at any time. Deletion removes the item's derived data — the transcript, the extracted fields, and the embeddings — and, once media storage is enabled, its stored thumbnail and frames.

6.5 Magpie does not play another party's video inside the app. It shows a thumbnail when available and links out to the source.

---

## 7. Visibility and shared collections (planned)

7.1 Your saved items are private to your account. Only you can read a saved item and the data derived from it.

7.2 Magpie is planned to support shared collections. That feature is not available yet: the current implementation is database schema and Row-Level Security (RLS) only, with no API routes or UI for collections or members. Nothing in this section promises a service that exists today.

7.3 When shared collections are available, membership will grant a member access to the collection and its item links only — which items are linked, their order, and who added each link. It will not grant access to another member's saved item, transcript, frames, extracted fields, or embeddings, and ownership of an item will never transfer.

7.4 Collections will not be public. There is no public link, public profile, or public index, and membership will be limited to accounts the owner adds.

7.5 Membership and roles will be enforced in the database with Row-Level Security. The owner is `collections.owner_id`; roles grant scoped access only and do not inherit through nested collections.

---

## 8. Disclaimers and limitation of liability

8.1 Magpie is provided as is. Capture depends on platforms that Magpie does not control, and a link may fail, change, or become unavailable without notice.

8.2 Magpie does not guarantee that extraction is accurate. Extracted fields carry evidence and confidence, and you should check anything you intend to rely on.

8.3 To the extent the law allows, Magpie is not liable for indirect or consequential loss arising from use of the service.

8.4 Nothing in these terms limits liability that cannot be limited by law.

---

## 9. What these terms do not do

9.1 These terms bind you, the user. They do not bind Meta, Instagram, or the creator of any content.

9.2 These terms do not make the fetching of platform content permitted under the platform's own terms. Platform terms and copyright are separate questions, and they apply independently of your warranty in section 2.

9.3 These terms do not cover licensed music. A Reel may contain commercial music whose rights are held by labels or collecting societies. Your warranty does not cover those rights, and Magpie does not obtain a licence for them.

9.4 These terms do not cure any exposure created by platform terms. They allocate risk between you and Magpie; they do not change the position of any third party.

9.5 These terms do not give you a right to save public content. They record the basis on which Magpie is willing to process content you submit, and the limits of that basis.
