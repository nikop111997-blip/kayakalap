import clientPromise from "@/lib/mongodb"

function calculateTrend(current, previous) {
  if (previous === 0) return { value: "0%", positive: true }

  const change = ((current - previous) / previous) * 100

  return {
    value: change.toFixed(1) + "%",
    positive: change >= 0
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)

    const range = searchParams.get("range") || "monthly"

    const client = await clientPromise
    const db = client.db("kayakalap")

    const contactsCol = db.collection("contacts")
    const quizCol = db.collection("leads")
    const newsletterCol = db.collection("newsletter")

    // ======================
    // 📅 DATE SETUP
    // ======================
    const now = new Date()

    const last7Days = new Date()
    last7Days.setDate(now.getDate() - 7)

    const last30Days = new Date()
    last30Days.setDate(now.getDate() - 30)

    const prev30Days = new Date()
    prev30Days.setDate(last30Days.getDate() - 30)

    // ======================
    // 📊 RANGE LOGIC (CHART)
    // ======================
    let matchStage = {}
    let groupFormat = "%d %b"

    if (range === "daily") {
      const last24Hours = new Date()
      last24Hours.setHours(last24Hours.getHours() - 24)

      matchStage = { createdAt: { $gte: last24Hours } }
      groupFormat = "%H:00"
    }

    if (range === "weekly") {
      matchStage = { createdAt: { $gte: last7Days } }
      groupFormat = "%d %b"
    }

    if (range === "monthly") {
      matchStage = { createdAt: { $gte: last30Days } }
      groupFormat = "%d %b"
    }

    // ======================
    // 🔢 TOTAL COUNTS
    // ======================
    const totalContacts = await contactsCol.countDocuments()
    const totalQuiz = await quizCol.countDocuments()
    const totalNewsletter = await newsletterCol.countDocuments()

    const totalLeads = totalContacts + totalQuiz + totalNewsletter

    // ======================
    // 📈 TREND CALCULATION (LAST 30 DAYS)
    // ======================
    const currentContacts = await contactsCol.countDocuments({
      createdAt: { $gte: last30Days }
    })

    const previousContacts = await contactsCol.countDocuments({
      createdAt: { $gte: prev30Days, $lt: last30Days }
    })

    const currentQuiz = await quizCol.countDocuments({
      createdAt: { $gte: last30Days }
    })

    const previousQuiz = await quizCol.countDocuments({
      createdAt: { $gte: prev30Days, $lt: last30Days }
    })

    const currentNewsletter = await newsletterCol.countDocuments({
      createdAt: { $gte: last30Days }
    })

    const previousNewsletter = await newsletterCol.countDocuments({
      createdAt: { $gte: prev30Days, $lt: last30Days }
    })

    // ======================
    // 📊 STATUS BREAKDOWN
    // ======================
    const statusStats = await contactsCol.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]).toArray()

    // ======================
    // 🎯 TOP GOALS
    // ======================
    const goals = await contactsCol.aggregate([
      {
        $group: {
          _id: "$goal",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]).toArray()

    // ======================
    // 🏋️ PROGRAMS
    // ======================
    const programs = await contactsCol.aggregate([
      {
        $group: {
          _id: "$program",
          count: { $sum: 1 }
        }
      }
    ]).toArray()

    // ======================
    // 📈 CHART DATA (DYNAMIC RANGE)
    // ======================
    const dailyLeads = await contactsCol.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: groupFormat, date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray()

    // ======================
    // 📊 QUIZ SCORES
    // ======================
    const quizScores = await quizCol.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $gte: ["$score", 70] }, "High",
              { $cond: [{ $gte: ["$score", 40] }, "Medium", "Low"] }
            ]
          },
          count: { $sum: 1 }
        }
      }
    ]).toArray()

    // ======================
    // 📬 RECENT CONTACTS
    // ======================
    const recentContacts = await contactsCol
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray()

    // ======================
    // 🌍 SOURCES
    // ======================
    const sources = await quizCol.aggregate([
      {
        $group: {
          _id: "$source",
          count: { $sum: 1 }
        }
      }
    ]).toArray()

    // ======================
    // 🚀 FINAL RESPONSE
    // ======================
    return Response.json({
      cards: {
        totalLeads,
        totalContacts,
        totalQuiz,
        totalNewsletter
      },

      trends: {
        leads: calculateTrend(
          currentContacts + currentQuiz + currentNewsletter,
          previousContacts + previousQuiz + previousNewsletter
        ),
        contacts: calculateTrend(currentContacts, previousContacts),
        quiz: calculateTrend(currentQuiz, previousQuiz),
        newsletter: calculateTrend(currentNewsletter, previousNewsletter)
      },

      statusStats,
      goals,
      programs,
      dailyLeads,
      quizScores,
      sources,
      recentContacts
    })

  } catch (error) {
    console.error(error)
    return Response.json({ error: true })
  }
}