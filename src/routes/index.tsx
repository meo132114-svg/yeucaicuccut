import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ChevronRight, FileText, Folder, School, Sprout } from "lucide-react";
import { DEMO_IMAGES } from "@/lib/demo-images";
import { foldersQueryOptions, postsQueryOptions } from "@/lib/timeline";

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(foldersQueryOptions),
      context.queryClient.ensureQueryData(postsQueryOptions),
    ]),
  head: () => ({
    meta: [
      { title: "Kỷ niệm 30 năm thành lập — Trường THPT Bà Điểm" },
      {
        name: "description",
        content:
          "Trang chủ kỷ niệm 30 năm thành lập Trường THPT Bà Điểm — hành trình 30 năm và những người gieo mầm.",
      },
      { property: "og:title", content: "Kỷ niệm 30 năm thành lập — Trường THPT Bà Điểm" },
      {
        property: "og:description",
        content: "Hành trình 30 năm thành lập Trường THPT Bà Điểm.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: DEMO_IMAGES[0] },
      { name: "twitter:image", content: DEMO_IMAGES[0] },
    ],
  }),
  component: Index,
});

function MarqueeRow({ images, reverse = false }: { images: readonly string[]; reverse?: boolean }) {
  const doubled = [...images, ...images];
  return (
    <div className="relative overflow-hidden py-2" aria-hidden="true">
      <div className={reverse ? "marquee-track-reverse gap-4 pr-4" : "marquee-track gap-4 pr-4"}>
        {doubled.map((src, i) => (
          <img
            key={`${src}-${i}`}
            src={src}
            alt=""
            loading="lazy"
            className="h-52 w-80 shrink-0 rounded-xl object-cover shadow-md md:h-64 md:w-96"
          />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}

function Index() {
  const { data: folders } = useSuspenseQuery(foldersQueryOptions);
  const { data: posts } = useSuspenseQuery(postsQueryOptions);
  const recentItems = [
    ...folders.map((folder) => ({ ...folder, type: "folder" as const })),
    ...posts.map((post) => ({ ...post, type: "post" as const })),
  ]
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .slice(0, 6);

  return (
    <div>
      {/* Hero */}
      <section className="hero-navy text-primary-foreground">
        <div className="mx-auto flex max-w-5xl flex-col items-center px-4 pt-40 pb-16 text-center md:py-24">
          <h1 className="font-display text-4xl leading-tight font-bold md:text-6xl lg:text-7xl">
            Hành trình <span className="text-accent">30 năm</span>
            <br />
            thành lập trường
          </h1>
          <p className="mt-6 max-w-2xl text-base text-primary-foreground/85 md:text-lg">
            Ba thập kỷ gieo chữ — một chặng đường đầy tự hào. Cùng xem lại những cột mốc đáng nhớ
            của mái trường thân yêu.
          </p>
          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              to="/hanh-trinh-30-nam"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3 text-sm font-semibold text-accent-foreground shadow-lg transition-transform hover:scale-[1.03] md:text-base"
            >
              <School className="h-5 w-5" />
              Vào hành trình 30 năm
            </Link>
            <Link
              to="/nguoi-gieo-mam"
              className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/40 px-7 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10 md:text-base"
            >
              <Sprout className="h-5 w-5" />
              Người gieo mầm
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-background py-12 md:py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 lg:grid-cols-12">
          <aside className="lg:col-span-5" aria-labelledby="recent-timeline-heading">
            <h2
              id="recent-timeline-heading"
              className="font-display text-2xl font-bold text-foreground md:text-3xl"
            >
              Bài viết mới nhất
            </h2>
            <div className="mt-6 space-y-3">
              {recentItems.map((item) => {
                const isFolder = item.type === "folder";
                const title = isFolder ? item.name : item.title;
                const Icon = isFolder ? Folder : FileText;

                return (
                  <Link
                    key={`${item.type}-${item.id}`}
                    to="/hanh-trinh-30-nam/$nodeId"
                    params={{ nodeId: item.id }}
                    className="group flex min-w-0 items-center gap-3 rounded-lg border border-border/70 p-3 transition-all hover:bg-muted/60 sm:gap-4 sm:p-4"
                  >
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-muted-foreground sm:h-20 sm:w-20">
                      {item.image_url ? (
                        <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Icon className="h-7 w-7" aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-foreground">{title}</h3>
                      {!isFolder && item.author_name && (
                        <p className="truncate text-xs text-muted-foreground">
                          Người viết: {item.author_name}
                        </p>
                      )}
                      {item.description && (
                        <p className="truncate text-sm text-muted-foreground">{item.description}</p>
                      )}
                    </div>
                    <ChevronRight
                      className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                      aria-hidden="true"
                    />
                  </Link>
                );
              })}
              <Link
                to="/hanh-trinh-30-nam"
                className="inline-flex items-center gap-2 pt-2 font-semibold text-primary hover:underline"
              >
                Xem toàn bộ Hành trình 30 năm <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </aside>

          <article className="lg:col-span-7">
            <h2 className="font-display text-2xl leading-snug font-bold text-foreground md:text-4xl">
              30 NĂM THÀNH LẬP TRƯỜNG THPT BÀ ĐIỂM – HÀNH TRÌNH CỦA NIỀM TIN VÀ TRI THỨC
            </h2>
            <div className="timeline-prose mt-6 text-base md:text-lg">
              <p>
                Ba mươi năm là một chặng đường đủ dài để viết nên truyền thống, vun đắp niềm tự hào
                và lưu giữ biết bao câu chuyện đẹp dưới mái trường thân yêu. Đó là những dấu mốc
                trưởng thành được kết tinh từ tâm huyết của bao thế hệ thầy cô, sự nỗ lực của nhiều
                thế hệ học sinh và những tình cảm chân thành dành cho mái trường mang tên Trường
                THPT Bà Điểm. Trên hành trình ba thập kỷ xây dựng và phát triển, Trường THPT Bà Điểm
                đã không ngừng đổi mới, trưởng thành và khẳng định vị thế của mình trong sự nghiệp
                giáo dục. Mỗi thế hệ thầy và trò đã cùng nhau viết tiếp những trang truyền thống
                đáng tự hào, góp phần tạo nên bản sắc riêng của nhà trường. Đằng sau những thành quả
                ấy là biết bao thế hệ nhà giáo tận tụy, những người đã âm thầm gieo mầm tri thức,
                chắp cánh ước mơ và nâng bước bao thế hệ học trò trên hành trình trưởng thành.
              </p>
              <p>
                Những miền ký ức không thể phai mờ... Đó là hình ảnh thầy cô trên bục giảng, tiếng
                trống trường vang lên mỗi buổi sớm, hàng cây in bóng sân trường, những giờ học thân
                quen, những mùa phượng nở và cả những lời chia tay lưu luyến của tuổi học trò. Dẫu
                thời gian có trôi qua, dẫu mỗi người đã đi đến những phương trời khác nhau, mái
                trường Bà Điểm vẫn luôn là nơi lưu giữ một phần thanh xuân, nơi những tình bạn được
                vun đắp, tình thầy trò được trân trọng và những ước mơ đầu đời được chắp cánh.
              </p>
              <p>
                Hướng đến kỷ niệm 30 năm thành lập Trường THPT Bà Điểm, trang website này được xây
                dựng như một không gian lưu giữ, kết nối và lan tỏa những giá trị tốt đẹp của nhà
                trường. Đây là nơi nhìn lại hành trình hình thành và phát triển, tôn vinh những
                thành tựu đáng tự hào, tri ân các thế hệ thầy cô mà còn là nhịp cầu để các thế hệ
                cựu học sinh, học sinh và những người từng gắn bó với trường cùng trở về với miền ký
                ức thân thương. Thông qua những hình ảnh, câu chuyện, tư liệu và lời chia sẻ, chúng
                tôi mong muốn mỗi người khi ghé thăm website đều có thể tìm thấy một dấu ấn của
                riêng mình; được sống lại những năm tháng dưới mái trường, được gửi gắm lòng biết ơn
                đến thầy cô và được tiếp nối sợi dây gắn kết giữa các thế hệ Bà Điểm.
              </p>
              <p>
                Trân trọng chào đón các thế hệ thầy cô, cựu học sinh, học sinh và những người yêu
                mến Trường THPT Bà Điểm cùng trở về, cùng sẻ chia và viết tiếp câu chuyện 30 năm đầy
                tự hào!
              </p>
            </div>
          </article>
        </div>
      </section>

      {/* Vòng lặp ảnh tư liệu */}
      <section className="overflow-hidden bg-background py-10 md:py-14">
        <h2 className="mb-6 text-center font-display text-2xl font-bold text-foreground md:text-3xl">
          Những khoảnh khắc tại trường THPT Bà Điểm
        </h2>
        <MarqueeRow images={DEMO_IMAGES} />
        <MarqueeRow images={[...DEMO_IMAGES].reverse()} reverse />
      </section>
    </div>
  );
}
